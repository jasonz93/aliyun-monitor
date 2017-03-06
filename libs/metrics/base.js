/**
 * Created by nicholas on 17-3-6.
 */
const util = require('util');
const _ = require('lodash');

/**
 *
 * @param {Monitor} monitor
 * @param {int} interval
 * @param {boolean} batch
 * @constructor
 */
function BaseMetric(monitor, interval, batch) {
    this._monitor = monitor;
    this._interval = interval;
    if (typeof batch === 'undefined') {
        batch = true;
    }
    this._batch = batch;
    this._datas = {};
}

/**
 *
 * @param {number} value
 * @param {object} dimensions
 * @param {function} callback
 */
BaseMetric.prototype.report = function (value, dimensions, callback) {
    if (arguments.length === 2) {
        if (typeof value === 'number') {
            if (typeof dimensions === 'function') {
                callback = dimensions;
                dimensions = {};
            } else if (typeof dimensions === 'object') {
                callback = () => {};
            } else {
                return callback(new Error('Illegal arguments.'));
            }
        } else if (typeof value === 'object' && typeof dimensions === 'function') {
            value = 1;
        } else {
            return callback(new Error('Illegal arguments.'));
        }
    } else if (arguments.length === 1) {
        if (typeof value === 'function') {
            callback = value;
            dimensions = {};
            value = 1;
        } else {
            callback = () => {};
            if (typeof value === 'number') {
                dimensions = {};
            } else if (typeof value === 'object') {
                dimensions = value;
                value = 1;
            } else {
                return callback(new Error('Illegal arguments.'));
            }
        }
    }
    let groupKey = '_';
    Object.getOwnPropertyNames(dimensions).sort().forEach((key) => {
        groupKey += dimensions[key] + '_';
    });
    let data = this._datas[groupKey];
    if (!data) {
        this._datas[groupKey] = data = _.extend(dimensions, {
            _value: 0,
            _count: 0,
            _lastReport: 0
        });
    }
    data._value += value;
    data._count ++;
    let timestamp = new Date().getTime();
    if (timestamp - data._lastReport >= this._interval) {
        data._lastReport = timestamp;
        data = this.calculate(data);
        if (this._batch) {
            this._monitor.batchReport(_.cloneDeep(data));
        } else {
            this._monitor.report(_.cloneDeep(data), callback);
        }
        data._value = 0;
        data._count = 0;
    }
};

/**
 * @name MetricData
 * @property {number} _value Recorded value
 * @property {int} _count Recorded count
 * @property {number} _lastReport
 * @property {number} value Value to report
 */

/**
 *
 * @param {MetricData} data
 * @returns {MetricData}
 */
BaseMetric.prototype.calculate = function (data) {
    throw new Error('Method not implemented.');
};


module.exports = BaseMetric;
