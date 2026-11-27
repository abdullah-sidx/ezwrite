import { APP_INFO } from '@ezwrite/core';

document.getElementById('app-name').textContent = APP_INFO.name;
document.getElementById('app-tagline').textContent = APP_INFO.tagline;
document.getElementById('stage-badge').textContent = APP_INFO.prototypeStage;
