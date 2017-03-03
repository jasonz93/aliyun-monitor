/**
 * Created by nicholas on 17-3-3.
 */
const {expect} = require('chai');
const signature = require('../libs/signature');

describe('Test signature method', () => {
    it('Generate signature', () => {
        let qs = signature.signature('GET', {
            Action: 'QueryMetric',
            period: 60,
            StartTime: '2016-02-02T10:33:56Z',
            Dimensions: "{instanceId:'i-23gp0zfjl'}",
            Project: 'acs_ecs',
            Metric: 'CPUUtilization',
            Version: '2015-10-20',
            Format: 'JSON',
            AccessKeyId: 'TestId',
            SignatureMethod: 'HMAC-SHA1',
            Timestamp: '2016-02-04T03:17:29Z',
            SignatureVersion: '1.0',
            SignatureNonce: '530b9e7a-71e5-4744-8548-77c5df29b8cb',
            RegionId: 'cn'
        }, 'TestSecret');
        expect(qs).to.be.equal('IxsQ79fVwUu33iwZeH11Z2PfwqQ=');
    })

    it('Generate qs object', () => {
        let qs = signature('GET', {
            Action: 'QueryMetric',
            period: 60,
            StartTime: '2016-02-02T10:33:56Z',
            Dimensions: "{instanceId:'i-23gp0zfjl'}",
            Project: 'acs_ecs',
            Metric: 'CPUUtilization'
        }, 'TestId', 'TestSecret');
        expect(qs).to.have.all.keys([
            'Action', 'period', 'StartTime', 'Dimensions', 'Project', 'Metric',
            'Version', 'Format', 'AccessKeyId', 'SignatureMethod', 'Timestamp', 'SignatureVersion', 'SignatureNonce', 'RegionId', 'Signature']);
    });
});