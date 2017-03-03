/**
 * Created by nicholas on 17-3-3.
 */
const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');

function encode(str) {
    return encodeURIComponent(str).replace(/'/g, '%27').replace(/\*/g, '%2A').replace(/%7E/g, '~');
}

/**
 * 
 * @param method
 * @param params
 * @param accessSecret
 * @returns {string} signature
 */
function signature(method, params, accessSecret) {
    let paramParts = [];
    Object.getOwnPropertyNames(params).sort().forEach(function (key) {
        paramParts.push(encode(key) + '=' + encode(params[key]));
    });
    let rawStr = method + '&%2F&' + encode(paramParts.join('&'));
    return crypto.createHmac('sha1', accessSecret + '&').update(rawStr).digest('base64');
}

/**
 *
 * @param method
 * @param params
 * @param accessKey
 * @param accessSecret
 * @returns {Object}
 */
function getQueryParams(method, params, accessKey, accessSecret) {
    let qs = _.extend(params, {
        Version: '2015-10-20',
        Format: 'JSON',
        AccessKeyId: accessKey,
        SignatureMethod: 'HMAC-SHA1',
        Timestamp: moment().utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z',
        SignatureVersion: '1.0',
        SignatureNonce: (Math.random() * 1000000).toString(),
        RegionId: 'cn-hangzhou'
    });
    qs.Signature = signature(method, qs, accessSecret);
    return qs;
}

exports = module.exports = getQueryParams;
exports.signature = signature;