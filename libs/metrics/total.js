/**
 * Created by nicholas on 17-3-6.
 */
const util = require('util');
const BaseMetric = require('./base');

/**
 *
 * @param monitor
 * @param interval
 * @param batch
 * @constructor
 */
function TotalMetric(monitor, interval, batch) {
    BaseMetric.call(this, monitor, interval, batch);
}

util.inherits(TotalMetric, BaseMetric);

TotalMetric.prototype.calculate = function (data) {
    data.value = data._value;
    return data;
}

module.exports = TotalMetric;