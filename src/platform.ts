import { API, IndependentPlatformPlugin, Logging, APIEvent, PlatformConfig } from 'homebridge';
import flatten = require('flat');
import * as fs from 'fs';
import path = require('path');

/**
 * Zigbee2MQTT Embedded Homebridge Platform
 * Parses config and starts Zigbee2MQTT as Homebridge addon.
 */
export class Zigbee2MQTTEmbeddedHomebridgePlatform implements IndependentPlatformPlugin {

  private readonly log: Logging;
  private readonly api: API;
  private readonly config: PlatformConfig;
  private controller?;

  /**
   * Instantiates a new instance.
   * @param log Logger to be used for logging
   * @param config Plugin configuration
   * @param api API to work on
   */
  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;
    this.config = config;
    // Register lifecycle events
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, this.startServer.bind(this));
    this.api.on(APIEvent.SHUTDOWN, this.stopServer.bind(this));
  }

  /**
   * Starts the Aedes server
   */
  startServer() {
    this.log('Starting Zigbee2MQTT.');
    // Config
    const configFile = path.join(this.api.user.persistPath(), 'configuration.yaml');
    try {
      fs.writeFileSync(configFile, 'advanced:\n  network_key: GENERATE\n  log_output:\n    - console', { flag: 'wx' });
      this.log('Created initial configuration.yaml file for Zigbee2MQTT.');
    } catch (error) {
      // file already exists 
    }
    // Hacky, I know, but there is no other way at the moment.
    process.env['ZIGBEE2MQTT_DATA'] = this.api.user.persistPath();
    const config = flatten(this.config, {delimiter: '_'});
    Object.keys(config).forEach(key => {
      process.env['ZIGBEE2MQTT_CONFIG_' + (key.toUpperCase())] = config[key];
    });
    // Also hacky, but again - no other way without changes in z2m
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Z2MController = require('zigbee2mqtt/lib/controller');
    // Start
    this.controller = new Z2MController(this.restartServer.bind(this), this.stopServer.bind(this));
    this.controller.start().then(() => {
      this.log('Zigbee2MQTT started successfully.');
    }).catch(err =>{
      this.log.warn(err);
    });
  }

  /*
  * Restarts the zigbee2mqtt server.
  */
  restartServer() {
    this.stopServer();
    this.startServer();
  }

  /**
   * Stops the Aedes server
   */
  stopServer() {
    this.log('Stopping Zigbee2MQTT.');
    this.controller.stop();
  }

}
