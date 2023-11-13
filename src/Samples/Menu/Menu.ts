import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IHostPageLayoutService, IMessageDialogOptions } from "azure-devops-extension-api";
import { WorkItem, WorkItemExpand, WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { CoreFields, AdditionalFields } from "./constants";

function createFieldPatchBlock(field: string, value: string): any {
    return {
        "op": "add",
        "path": "/fields/" + field,
        "value": value === undefined ? "" : value
    };
}

async function createWorkItem(workItem: WorkItem) {
    let patchDocument = [];
    const currentWorkItemType = workItem.fields[CoreFields.WorkItemType]

    var fieldsToCopy = [CoreFields.Title, CoreFields.AssignedTo, CoreFields.AreaPath, CoreFields.Description];

    let title = "Clone of " + workItem.fields[CoreFields.Title];

    // Add all fields to the patch document that will be used to create the work item
    fieldsToCopy.forEach(field => {
        if (field === CoreFields.Title && title && title.length > 0) {
            patchDocument.push(createFieldPatchBlock(field, title));
        }
        else {
            patchDocument.push(createFieldPatchBlock(field, workItem.fields[field]));
        }
    });

    var comment = `This work item was cloned from work item #${workItem.id}: ${workItem.fields[CoreFields.Title]}`;
    patchDocument.push(createFieldPatchBlock(CoreFields.History, comment));
    console.log(patchDocument);
    return getClient(WorkItemTrackingRestClient).createWorkItem(patchDocument, workItem.fields[CoreFields.Project], workItem.fields[CoreFields.WorkItemType]);
}

async function performClone(workItemId: number) {
    const sourceWorkItem = await getClient(WorkItemTrackingRestClient).getWorkItem(workItemId, undefined, undefined, undefined, WorkItemExpand.All);
    const targetWorkItem = await createWorkItem(sourceWorkItem);
    return targetWorkItem;
}

async function showDialog(workItemId: number) {
    var dialogOptions = <IMessageDialogOptions>{
        title: "Epic Clone",
        okText: "Clone",
        onClose: (result) => {
            if (result) {
                performClone(workItemId);
            }
        }
    }
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
    execute: (context: any) => {
        let workItemType = context.workItemTypeName || context.workItemTypeNames[0];

        if (workItemType != "Epic") {
            showErrDialog("You must initiate this action from an Epic");
            return;
        }

        let workItemId = context.workItemId || context.workItemIds[0];
        if (workItemId) {
            showDialog(workItemId);
        }
    }
};

SDK.register("epic-copy-menu", actionProvider);
SDK.init();