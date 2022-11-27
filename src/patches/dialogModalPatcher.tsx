import { afterPatch, findModuleChild } from "decky-frontend-lib";

const dialogModule = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]['m_ctorContextMenu']) {
            return m[prop];
        }
    }
});

export const PatchModalService = (callback:(e:any, ret:any) => void) => {
    const original = dialogModule.m_ctorContextMenu;
    if (original.name !== 'contextMenuWrapper') {
        const contextMenuWrapper = class extends original {
            constructor(e: { type: any; }, t: any, r: any, n: any, i: any) {
                afterPatch(e.type, 'type', (_, ret) => {
                    callback(e, ret);
                    return ret;
                });
                super(e, t, r, n, i);
              }
        };
        dialogModule.SetContextMenuConstructor(contextMenuWrapper);
    }    
    return {
        unpatch: () => {
            dialogModule.SetContextMenuConstructor(original);
        }
    }
};