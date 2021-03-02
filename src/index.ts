import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { Zigbee2MQTTEmbeddedHomebridgePlatform } from './platform'; 

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Zigbee2MQTTEmbeddedHomebridgePlatform);
};
