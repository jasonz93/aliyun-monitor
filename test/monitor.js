/**
 * Created by nicholas on 17-3-3.
 */
const {expect} = require('chai');
const os = require('os');
const Monitor = require('../libs/monitor');

describe('Test monitor', () => {
    let monitor = new Monitor('ACS/CUSTOM/1121930929925232', 'nodejs_response_time', 'Milliseconds', 'hostname');
    it('Test report a metric', (done) => {
        monitor.report({
            value: Math.random(),
            hostname: os.hostname()
        }, (err) => {
            done(err);
        })
    })
});