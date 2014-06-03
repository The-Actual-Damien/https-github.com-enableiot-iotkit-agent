/**
 * Created by ammarch on 5/21/14.
 */

var logger = require("../lib/logger").init(),
    common = require('../lib/common'),
    Cloud = require("../api/cloud.proxy"),
    utils = require("../lib/utils").init(),
    config = require('../config'),
    path = require('path');

var saveCode = function () {
    if (arguments.length < 1) {
        logger.error("Not enough arguments : ", arguments);
        process.exit(1);
    }
    var code = arguments[0];
    var filename = "agent-ids.json";
    var fullFilename = path.join(__dirname, '../certs/' +  filename);
    var data = common.readFileToJson(fullFilename);

    logger.info("Code to Set : ", code);
    data.activation_code = code;
    return common.writeToJson(fullFilename, data);
};
var resetToken = function () {
    var dataTokenReset =  {
        "deviceToken": false,
        "accountId": false
    };
    var fullFilename = path.join(__dirname, '../certs/' +  config.token_file);
    return common.writeToJson(fullFilename, dataTokenReset);
};
var activate = function () {
    if (arguments.length < 1) {
        logger.error("Not enough arguments : ", arguments);
        process.exit(1);
    }
    var code = arguments[0];
    utils.getDeviceId(function (id) {
        var cloud = Cloud.init(config, logger, id);
        cloud.activate(code, function (err) {
            var r = 0;
            cloud.disconnect();
            if (!err) {
                logger.info("Device Activated ");
            } else {
                logger.error("Error in the activation process ...", err);
                r = 1;
            }
            process.exit(r)
        });
    });
};
function testConnection () {
    var host = config.connector[config.default_connector].host;
    utils.getDeviceId(function (id) {
        var cloud = Cloud.init(config, logger, id);
        cloud.test(function (res) {
            var r = 0;
            if (res) {
                logger.info("Connected to %s", host);
                logger.info("Connected to Env %s", res.currentSetting);
                logger.info("Connected to Build %s", res.build);
                logger.debug("Full response %j", res );
            } else {
                logger.error("Not Connection to %s", host);
                r = 1;
            }
            process.exit(r)
        });
    })
}



module.exports = {
    addCommand : function (program) {
        program.option('-a, --activate <activaton code>', 'activate and send metadata');
        program.option('-i, --initialize', 'reset both the token and the components list')
        program.option('-R, --resettoken', 'clear Device Token');
        program.option('-t, --test', 'try to reach the mqtt or rest server over the network (whichever is configured) and indicate whether there is network connectivity.');

    },
    runCommand: function (program) {
        if (program.resettoken){
            resetToken();
        } else if (program.activate) {
            logger.info("activate and send metadata");
            activate(program.activate);
        }
        if (program.initialize) {
            resetToken();
            saveCode(false);
        }
        if (program.test) {
            testConnection();
        }

    }
};