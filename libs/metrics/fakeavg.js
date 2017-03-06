/**
 * Created by nicholas on 17-3-6.
 */
const util = require('util');
const BaseMetric = require('./base');
const _ = require('lodash');

/**
 *
 * @param {Monitor} monitor
 * @param {boolean} batch
 * @param {int} interval
 * @constructor
 */
function FakeAvg(monitor, interval, batch) {
    BaseMetric.call(this, monitor, interval, batch);
}

util.inherits(FakeAvg, BaseMetric);

/**
 *
 * @param {MetricData} data
 */
FakeAvg.prototype.calculate = function (data) {
    data.value = data._value / data._count;
    return data;
};

module.exports = FakeAvg;