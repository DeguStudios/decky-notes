import {
    definePlugin,
    Router,
    ServerAPI,
    staticClasses,
    findModuleChild
} from "decky-frontend-lib";
import { VFC } from "react";
import { BsPencilSquare } from "react-icons/bs";

import { Whiteboard, WhiteboardState } from "./components/Whiteboard";
import Gallery from "./components/Gallery";
import { GetImageService, ImageService } from "./services/imageService";
import { GetSteamClient, UnregisterHandle } from "./steam/steamClient";
import { GetSteamService } from "./steam/steamService";
import { PatchModalService } from "./patches/dialogModalPatcher";
import { ScreenshotNotification, SideMenu } from "./components/SideMenu";
import { GalleryRoutePath, SteamLocalHost, WhiteboardRoutePath } from "./consts";

const addWhiteboardRoute = (
    serverApi: ServerAPI, 
    findScreenshotUrl: (path:string|undefined) => Promise<string>,
    saveImageAndNotify: (image:WhiteboardState) => Promise<void>) => {

    interface WhiteboardRouteParameters {
        path: string | undefined;
    }
    
    const WhiteboardRoute: VFC<WhiteboardRouteParameters> = ({path}) => {
        return (
            <Whiteboard pickImage={() => findScreenshotUrl(path)} 
                        saveWhiteboard={(state) => saveImageAndNotify(state)}></Whiteboard>
        );
    };

    serverApi.routerHook.addRoute(`${WhiteboardRoutePath}/:screenshotHandle`, () => (
        <WhiteboardRoute path={window.location.href.toString().split('/').pop()}></WhiteboardRoute>
    ), {
        exact: true,
    });
};

const addGalleryRoute = (serverApi: ServerAPI, imageService:ImageService) => {

    const GalleryRoute: VFC = () => {
        return (
            <Gallery getAllImages={() => imageService.callListImagesApi()} 
                     getImage={(fileName) => imageService.callGetImageApi(fileName)}
                     deleteImage={(fileName) => imageService.callDeleteImageApi(fileName)}
                     getThumbnailImage={(fileName) => imageService.callGetThumbnailApi(fileName)}></Gallery>
        );
    };

    serverApi.routerHook.addRoute(GalleryRoutePath, () => (
        <GalleryRoute></GalleryRoute>
    ), {
        exact: true,
    });
};

const patchDeckyNotesButtonIntoDialogModal = (goToWhiteBoard: (screenshotHandle:string) => void) => {
    var ModalDialogButton = findModuleChild((m) => {
        if (typeof m !== 'object')
            return undefined;
        for (let prop in m) {
            if (m[prop]?.toString()?.includes('contextMenuItem') && m[prop]?.toString()?.includes('onSelected')) {
                return m[prop];
            }
        }
    })
    const DeckyNotesButtonId = 'c380565cddab4d1294086a3b29dc96bf';
    const DeckyNotesButton = ({screenshotHandle}:{screenshotHandle:string}): JSX.Element => {
        return (
            <ModalDialogButton onSelected={() => goToWhiteBoard(screenshotHandle)}><BsPencilSquare/> Edit in Decky Notes</ModalDialogButton>
        );
    };
    DeckyNotesButton.__id = DeckyNotesButtonId;

    return PatchModalService((e, ret) => {
        if (/^.*\/routes\/media(\/.*)?$/.test(window.location.href)) {
            const screenshotHandle = e.props.screenshotHandle;
            if (!e.props.screenshotHandle){
                return;
            }
            const existingDeckyNotesButton = ret.props.children.find((x:any) => x?.type?.__id === DeckyNotesButtonId);
            if (!existingDeckyNotesButton) {
                var separatorIndex = ret.props.children.lastIndexOf(false);
                var insertIndex = separatorIndex === -1 
                    ? ret.props.children.length
                    : separatorIndex;
                ret.props.children.splice(insertIndex, 0,
                    <DeckyNotesButton screenshotHandle={screenshotHandle} />
                );
            } else if (existingDeckyNotesButton.props.screenshotHandle !== screenshotHandle) {
                ret.props.children[ret.props.children.indexOf(existingDeckyNotesButton)] = <DeckyNotesButton screenshotHandle={screenshotHandle} />;
            }
        }
    });
}

export default definePlugin((serverApi: ServerAPI) => {
    const imageService = GetImageService(serverApi);
    const steamClient = GetSteamClient();
    const steamService = GetSteamService(steamClient);

    const screenshotUnregisterStorage = new Map<(notification: ScreenshotNotification) => void, UnregisterHandle>();
    const screenshotNotifier = {
        registerForScreenshotNotifications: async (callback: (notification: ScreenshotNotification) => void) => {
            var screenshot = await steamClient.Screenshots.GetLastScreenshotTaken();
            var handle = steamClient.GameSessions.RegisterForScreenshotNotification((notification) => {
                callback({
                    ImageSrcUrl: `${SteamLocalHost}/${notification.details.strUrl}`,
                    ScreenshotHandle: `local_${notification.details.hHandle.toString()}`
                })
            });
            screenshotUnregisterStorage.set(callback, handle);
            if (screenshot?.strUrl) {
                callback({
                    ImageSrcUrl: `${SteamLocalHost}/${screenshot.strUrl}`,
                    ScreenshotHandle: `local_${screenshot.hHandle.toString()}`
                })
            }
        },
        unregisterForScreenshotNotifications: (callback: (notification: ScreenshotNotification) => void) =>{
            var handle = screenshotUnregisterStorage.get(callback);
            if (handle) {
                handle.unregister();
                screenshotUnregisterStorage.delete(callback);
            }
        }
    };

    const findScreenshotUrl = async (screenshotHandle: string | undefined) => {
        if (!screenshotHandle) {
            return '';
        }
        var result = await steamService.tryGetScreenshotDetails(screenshotHandle);
        if (result) {
            return result.image_url;
        } else {
            return '';
        }
    }

    const saveImageAndNotify = async (state: WhiteboardState): Promise<void> => {
        var fileName = await imageService.callSaveImageApi(state.imageDataUrl, state.thumbnailDataUrl);
        serverApi.toaster.toast({
            title: 'Note saved!',
            body: 'Saved at: ' + fileName,
            logo: <img src={state.iconDataUrl}></img>           
        });
    }

    const goToWhiteBoard = (screenshotHandle: string) => {
        Router.Navigate(`${WhiteboardRoutePath}/${screenshotHandle}`)
    };

    const patch = patchDeckyNotesButtonIntoDialogModal(goToWhiteBoard);
    addWhiteboardRoute(serverApi, findScreenshotUrl, saveImageAndNotify);
    addGalleryRoute(serverApi, imageService);

    console.log('Decky Notes loaded');

    return {
        title: <div className={staticClasses.Title}>Decky Notes</div>,
        content: <SideMenu notifier={screenshotNotifier} />,
        icon: <BsPencilSquare />,
        onDismount() {
            patch.unpatch();
            serverApi.routerHook.removeRoute(WhiteboardRoutePath);
            serverApi.routerHook.removeRoute(GalleryRoutePath);            
        },
    };
});