/**
 * Created by nicholas on 17-3-6.
 */
const {expect} = require('chai');
const os = require('os');
const Monitor = require('../libs/monitor');
describe('Test metrics', () => {
    let monitor = new Monitor('ACS/CUSTOM/1121930929925232', 'nodejs_response_time', 'Milliseconds', ['hostname', 'uri'], 200, 1000);
    let mock = [];
    for (let i = 0; i < 30; i ++) {
        mock.push(Math.random());
    }

    it('Test total metric', function (done) {
        this.timeout(10000);
        monitor.removeAllListeners();
        let metric = monitor.createTotalMetric();
        let total = 0;
        let dimensions = {
            hostname: os.hostname()
        };
        let onError = (err) => {
            done(err);
        };
        let onReport = (payload) => {
            expect(payload.length).to.be.equal(1);
            expect(payload[0].value).to.be.equal(total);
            done();
        };
        monitor.on('error', onError);
        monitor.on('report', onReport);
        mock.forEach((val) => {
            total += val;
            metric.report(val, dimensions);
        });
        setTimeout(() => {
            metric.report(0, dimensions);
        }, 1100);
    });

    it('Test fake avg metric', function (done) {
        this.timeout(10000);
        monitor.removeAllListeners();
        let metric = monitor.createFakeAvgMetric();
        let total = 0;
        let dimensions = {
            hostname: os.hostname()
        };
        let onError = (err) => {
            done(err);
        };
        monitor.on('error', onError);
        mock.forEach((val) => {
            total += val;
            metric.report(val, dimensions);
        });
        let onReport = (payload) => {
            expect(payload.length).to.be.equal(1);
            expect(payload[0].value).to.be.equal(total / mock.length + 1);
            done();
        };
        monitor.on('report', onReport);
        setTimeout(() => {
            metric.report(0, dimensions);
        }, 1100);
    })
});