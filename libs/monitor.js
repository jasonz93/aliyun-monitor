/**
 * Created by nicholas on 17-3-3.
 */
const request = require('request');
const util = require('util');
const events = require('events');
const _ = require('lodash');
const FakeAvg = require('./metrics/fakeavg');
const TotalMetric = require('./metrics/total');

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
    this._batchCount = batchCount;
    this._batchInterval = batchInterval;
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
 * Start batch timer
 * @param {int} batchCount Max commit count
 * @param {int} batchInterval Max commit interval in millis
 */
Monitor.prototype.startBatch = function (batchCount, batchInterval) {
    if (!this._batch) {
        this._batch = [];
    }
    this._batchCount = batchCount;
    this._batchInterval = batchInterval;
    this._batchTimer = setInterval(() => {
        let batch = this._batch;
        this.report(batch, (err) => {
            if (err) {
                this._batch.push(batch);
                //TODO: Log warn
            }
            //TODO: Log info
        });
        this._batch = [];
    }, batchInterval);
};

/**
 * Stop batch timer
 */
Monitor.prototype.stopBatch = function () {
    if (this._batchTimer) {
        clearInterval(this._batchTimer);
    }
};

/**
 * Add metrics to batch queue
 * @param {object|Array} metrics
 */
Monitor.prototype.batchReport = function (metrics) {
    if (!this._batchTimer) {
        this.startBatch(this._batchCount, this._batchInterval);
    }
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
    })
    this._batch.push(metrics);
    if (this._batch.length >= this._batchCount) {
        let batch = this._batch;
        this.report(batch, (err) => {
            if (err) {
                this._batch.push(batch);
                //TODO: Log warn
            }
            //TODO: Log info
        });
        this._batch = [];
    }
};

/**
 *
 * @returns {TotalMetric}
 */
Monitor.prototype.createTotalMetric = function () {
    return new TotalMetric(this, this._batchInterval);
}

/**
 *
 * @returns {FakeAvg}
 */
Monitor.prototype.createFakeAvgMetric = function () {
    return new FakeAvg(this, this._batchInterval);
}

module.exports = Monitor;