/**
 * Created by nicholas on 17-3-3.
 */
const {expect} = require('chai');
const os = require('os');
const Monitor = require('../libs/monitor');

describe('Test monitor', () => {
    it('Test report a metric', function (done) {
        this.timeout(10000);
        let monitor = new Monitor('ACS/CUSTOM/1121930929925232', 'nodejs_response_time', 'Milliseconds', 'hostname');
        monitor.report({
            value: Math.random(),
            hostname: os.hostname()
        }, (err) => {
            done(err);
        })
    });

    it('Test batch report when count reached', function (done) {
        this.timeout(10000);
        let count = 30;
        let batchCount = 20;
        let commited = 0;
        let monitor = new Monitor('ACS/CUSTOM/1121930929925232', 'nodejs_response_time', 'Milliseconds', 'hostname', batchCount);
        monitor.on('error', (err) => {
            done(err);
        });
        monitor.on('report', (payload) => {
            commited += payload.length;
            if (commited === count) {
                done();
                return;
            }
            expect(payload.length).to.be.equal(batchCount);
        });
        for (let i = 0; i < count; i ++) {
            monitor.batchReport({
                value: Math.random(),
                hostname: os.hostname()
            });
        }
    });

    it('Test batch report when interval reached', function (done) {
        this.timeout(10000);
        let interval = 1000;
        let count = 30;
        let commited = 0;
        let monitor = new Monitor('ACS/CUSTOM/1121930929925232', 'nodejs_response_time', 'Milliseconds', 'hostname', 200, interval);
        monitor.on('error', (err) => {
            done(err);
        });
        monitor.on('report', (payload) => {
            commited += payload.length;
            expect(payload.length).to.be.equal(count);
            if (commited === count) {
                done();
            }
        });
        for (let i = 0; i < count; i ++) {
            monitor.batchReport({
                value: Math.random(),
                hostname: os.hostname()
            });
        }
    })
});