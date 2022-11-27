import { afterPatch, findModuleChild } from "decky-frontend-lib";

const dialogModule = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]['SetContextMenuConstructor'] && m[prop]['GetContextMenuConstructorWithDefault']) {
            return m[prop];
        }
    }
});

export const PatchModalService = (callback:(e:any, ret:any) => void) => {
    const spWindow = FocusNavController.m_ActiveContext.m_rgGamepadNavigationTrees.find((x:any) => x.m_ID == 'root_1_').Root.Element.ownerDocument.defaultView;
    const original = dialogModule.GetContextMenuConstructorWithDefault(spWindow);

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
        dialogModule.SetContextMenuConstructor(spWindow, contextMenuWrapper);
    }    
    return {
        unpatch: () => {
            dialogModule.SetContextMenuConstructor(original);
        }
    }
};