import 'es6-promise/auto';
import * as SDK from 'azure-devops-extension-sdk';
import { showCloneDialog, showErrDialog } from './dialogService';

const actionProvider = {
  execute: (context: any) => {
    let workItemType = context.workItemTypeName || context.workItemTypeNames[0];

    if (workItemType != 'Epic') {
      showErrDialog('You must initiate this action from an Epic');
      return;
    }

    let workItemId = context.workItemId || context.workItemIds[0];
    if (workItemId) {
      showCloneDialog(workItemId);
    }
  },
};

SDK.register('epic-copy-menu', actionProvider);
SDK.init();
