/**
 * Created by nicholas on 17-3-3.
 */
const request = require('request');

/**
 *
 * @param {string} namespace
 * @param {string} metricName
 * @param {string} unit
 * @constructor
 */
function Monitor(namespace, metricName, unit, dimensions) {
    this._namespace = namespace;
    this._metricName = metricName;
    this._unit = unit;
    if (typeof dimensions === 'string') {
        this._dimensions = [fields];
    } else if (dimensions instanceof Array) {
        this._dimensions = fields;
    }
    let nsParts = namespace.split('/');
    if (nsParts.length === 3) {
        this._userid = nsParts[2];
    } else {
        throw new Error('Illegal namespace');
    }
}

/**
 *
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
            data.timestamp = new Date().getTime();
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
    request('http://open.cms.aliyun.com/metrics/put', {
        method: 'POST',
        form: {
            userId: this._userid,
            namespace: this._namespace,
            metrics: JSON.stringify(payload)
        }
    }, (err, response, data) => {
        if (err) {
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
            callback(error);
        } else {
            callback(null);
        }
    })
};

module.exports = Monitor;