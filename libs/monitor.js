/**
 * Created by nicholas on 17-3-3.
 */
const request = require('request');
const util = require('util');
const events = require('events');
const _ = require('lodash');
const BatchExecutor = require('batch-executor');

/**
 *
 * @param {string} namespace
 * @param {string} metricName
 * @param {string} unit
 * @param {string|Array} dimensions
 * @param {int} [batchCount]
 * @param {int} [batchInterval]
 * @constructor
 */
function Monitor(namespace, metricName, unit, dimensions, batchCount, batchInterval) {
    this._namespace = namespace;
    this._metricName = metricName;
    this._unit = unit;
    if (typeof dimensions === 'string') {
        this._dimensions = [dimensions];
    } else if (dimensions instanceof Array) {
        this._dimensions = dimensions;
    }
    let nsParts = namespace.split('/');
    if (nsParts.length === 3) {
        this._userid = nsParts[2];
    } else {
        throw new Error('Illegal namespace');
    }
    if (!batchCount) {
        batchCount = 200;
    }
    if (!batchInterval) {
        batchInterval = 5000;
    }
    this._executor = new BatchExecutor(batchCount, batchInterval);
    this._executor.on('error', (err) => {
        this.emit('error', err);
    });
    this._executor.on('execute', (batch, callback) => {
        this.report(batch, (err) => {
            if (err) {
                callback(err);
            }
        });
    })
}

util.inherits(Monitor, events.EventEmitter);

/**
 * Report metrics
 * @param {object|Array} metrics
 * @param {function} callback
 */
Monitor.prototype.report = function (metrics, callback) {
    if (typeof callback !== 'function') {
        callback = () => {};
    }
    if (!(metrics instanceof Array)) {
        if (typeof metrics === 'object') {
            metrics = [metrics];
        } else {
            return callback(new Error('Illegal metrics.'));
        }
    }
    let payload = [];
    metrics.forEach((metric) => {
        let data = {
            value: metric.value,
            dimensions: {}
        };
        if (metric.timestamp) {
            data.timestamp = metric.timestamp.toString();
        } else {
            data.timestamp = new Date().getTime().toString();
        }
        data.metricName = this._metricName;
        data.unit = this._unit;
        this._dimensions.forEach((dimension) => {
            if (metric[dimension]) {
                data.dimensions[dimension] = metric[dimension];
            }
        });
        payload.push(data);
    });
    if (payload.length > 0) {
        request('http://open.cms.aliyun.com/metrics/put', {
            method: 'POST',
            form: {
                userId: this._userid,
                namespace: this._namespace,
                metrics: JSON.stringify(payload)
            }
        }, (err, response, data) => {
            if (err) {
                this.emit('error', err);
                callback(err);
            } else if (response.statusCode !== 200) {
                let msg = null;
                let error;
                try {
                    msg = JSON.parse(data);
                    error = new Error(msg.msg);
                    error.name = msg.code;
                    callback(error);
                } catch (e) {
                    error = new Error('Unknown error.');
                    error.data = data;
                }
                this.emit('error', error);
                callback(error);
            } else {
                this.emit('report', payload);
                callback(null);
            }
        })
    }
};

/**
 * Add metrics to batch queue
 * @param {object|Array} metrics
 */
Monitor.prototype.batchReport = function (metrics) {
    if (!(metrics instanceof Array)) {
        if (typeof metrics === 'object') {
            metrics = [metrics];
        } else {
            throw new Error('Illegal metrics.');
        }
    }
    metrics = _.cloneDeep(metrics);
    metrics.forEach((metric) => {
        metric.timestamp = new Date().getTime().toString();
    });
    this._executor.batch(metrics);
};

module.exports = Monitor;