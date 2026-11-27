import { APP_INFO } from '@ezwrite/core';

chrome.runtime.onInstalled.addListener(() => {
  console.info(`${APP_INFO.name} extension initialized (${APP_INFO.prototypeStage}).`);
});
