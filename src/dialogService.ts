import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, IHostPageLayoutService, IMessageDialogOptions } from 'azure-devops-extension-api';

import { performClone } from './workItemService';

export async function showCloneDialog(workItemId: number) {
  var dialogOptions = <IMessageDialogOptions>{
    title: 'Epic Clone',
    okText: 'Clone',
    onClose: result => {
      if (result) {
        performClone(workItemId);
      }
    },
  };
  const dialogMsg = 'Are you sure you want to clone this epic?';
  const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
  dialogSvc.openMessageDialog(dialogMsg, dialogOptions);
}

export async function showErrDialog(message: string) {
  var dialogOptions = <IMessageDialogOptions>{
    title: 'Epic Clone',
    showCancel: false,
  };
  const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
  dialogSvc.openMessageDialog(message, dialogOptions);
}
