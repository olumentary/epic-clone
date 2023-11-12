import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IHostPageLayoutService, IMessageDialogOptions } from "azure-devops-extension-api";
import { WorkItem, WorkItemExpand, WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";

async function cloneEpic(workItemId: number) {
    const wi = await getClient(WorkItemTrackingRestClient).getWorkItem(workItemId, undefined, undefined, undefined, WorkItemExpand.All);
    console.log(wi.fields["System.Title"]);
}

async function showDialog(workItemId: number) {
    var dialogOptions = <IMessageDialogOptions>{
        title: "Epic Clone",
        okText: "Clone",
        onClose: (result) => {
            if (result) {
                cloneEpic(workItemId);
            }
        }
    }
    const wi = await getClient(WorkItemTrackingRestClient).getWorkItem(workItemId, undefined, undefined, undefined, WorkItemExpand.All);
    const dialogMsg = "Are you sure you want to clone this epic?"
    const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
    dialogSvc.openMessageDialog(dialogMsg, dialogOptions);
}

async function showErrDialog(message: string) {
    var dialogOptions = <IMessageDialogOptions>{
        title: "Epic Clone",
        showCancel: false
    }
    const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
    dialogSvc.openMessageDialog(message, dialogOptions);
}

const actionProvider = {
    execute: async (context: any) => {
        let workItemType = context.workItemTypeName || context.workItemTypeNames[0];

        if (workItemType != "Epic") {
            showErrDialog("You must initiate this action from an Epic");
            return;
        }

        let workItemId = context.workItemId || context.workItemIds[0];
        if (workItemId) {
            showDialog(workItemId);
        }
        //const wi = await getClient(WorkItemTrackingRestClient).getWorkItem(context.id, undefined, undefined, undefined, WorkItemExpand.All);
        // const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        // dialogSvc.openMessageDialog(`Work Item ID: ${workItemId}, Work Item Type: ${workItemType}`, { showCancel: false });
    }
};

SDK.register("epic-copy-menu", actionProvider);
SDK.init();