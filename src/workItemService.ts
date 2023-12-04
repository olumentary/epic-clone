import { getClient } from 'azure-devops-extension-api';
import { WorkItem, WorkItemExpand, WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking';
import { CoreFields, AdditionalFields } from './constants';

function createFieldPatchBlock(field: string, value: string): any {
  return {
    op: 'add',
    path: '/fields/' + field,
    value: value === undefined ? '' : value,
  };
}

async function createWorkItem(workItem: WorkItem) {
  let patchDocument = [];
  const currentWorkItemType = workItem.fields[CoreFields.WorkItemType];

  var fieldsToCopy = [CoreFields.Title, CoreFields.AssignedTo, CoreFields.AreaPath, CoreFields.Description];

  let title = 'Clone of ' + workItem.fields[CoreFields.Title];

  // Add all fields to the patch document that will be used to create the work item
  fieldsToCopy.forEach(field => {
    if (field === CoreFields.Title && title && title.length > 0) {
      patchDocument.push(createFieldPatchBlock(field, title));
    } else {
      patchDocument.push(createFieldPatchBlock(field, workItem.fields[field]));
    }
  });

  var comment = `This work item was cloned from work item #${workItem.id}: ${workItem.fields[CoreFields.Title]}`;
  patchDocument.push(createFieldPatchBlock(CoreFields.History, comment));
  console.log(patchDocument);
  return getClient(WorkItemTrackingRestClient).createWorkItem(patchDocument, workItem.fields[CoreFields.Project], workItem.fields[CoreFields.WorkItemType]);
}

async function collectChildIds(workItem: WorkItem, visited = new Set<number>()): Promise<number[]> {
  const childIds: Set<number> = new Set();
  const promises: Promise<void>[] = [];

  for (const relation of workItem.relations) {
    // Get Childs Only
    if (relation.rel == 'System.LinkTypes.Hierarchy-Forward') {
      const childUrl = relation.url;
      const childId = parseInt(/[^/]*$/.exec(childUrl)![0]);

      // Track if child node is already visited to avoid duplicates
      if (!visited.has(childId)) {
        visited.add(childId);
        childIds.add(childId);

        const promise = (async () => {
          const newWorkItem = await getClient(WorkItemTrackingRestClient).getWorkItem(childId, undefined, undefined, undefined, WorkItemExpand.All);
          const childIdsFromChild = await collectChildIds(newWorkItem, visited);
          childIdsFromChild.forEach(id => childIds.add(id));
        })();

        promises.push(promise);
      }
    }
  }

  // Avoid infinite recursion due to async/await nature by awaiting for promises
  await Promise.all(promises);

  // Convert Set to Array before returning
  return Array.from(childIds);
}

async function cloneChild(childId: number) {
  const childWorkItem = await getClient(WorkItemTrackingRestClient).getWorkItem(childId, undefined, undefined, undefined, WorkItemExpand.All);
  console.log(childWorkItem);
}

export async function performClone(workItemId: number) {
  const sourceWorkItem = await getClient(WorkItemTrackingRestClient).getWorkItem(workItemId, undefined, undefined, undefined, WorkItemExpand.All);
  //const targetWorkItem = await createWorkItem(sourceWorkItem);
  const childIds = await collectChildIds(sourceWorkItem);
  childIds.forEach(childId => {
    cloneChild(childId);
  });
  // return targetWorkItem;
}
