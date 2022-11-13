import { findModuleChild } from "decky-frontend-lib";
import { SteamClientHandle } from "./steamClient";

const packetGenerator = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]['InitFromPacket']) {
            return m[prop];
        }
    }
})
const fileDetailsRequestBlueprint = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]?.deserializeBinary && m[prop].toString().includes('CPublishedFile_GetDetails_Request')) {
            return m[prop];
        }
    }
});
const fileService = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]?.GetDetails) {
            return m[prop];
        }
    }
});
const cmServiceHandler = findModuleChild((m) => {
    if (typeof m !== 'object')
        return undefined;
    for (let prop in m) {
        if (m[prop]?.CMInterface?.GetServiceTransport) {
            return m[prop];
        }
    }
});

const getScreenshotDetails = async (steamClient: SteamClientHandle, screenshotHandle: string): Promise<ScreenshotDetails|null> => {
    var request = packetGenerator.Init(fileDetailsRequestBlueprint);
    const prefix = screenshotHandle.includes('local') ? 'local' : 'remote';
    const id = screenshotHandle.substring(prefix.length + 1);
    if (prefix === 'local') {
        var allLocalScreenshots = await steamClient.Screenshots.GetAllAppsLocalScreenshots();
        var screenshot = allLocalScreenshots.find(x => x.hHandle === Number(id));

        if (!screenshot) {
            console.log('Could not find local screenshot: ' + id);
            return null;
        }

        return {
            consumer_appid: screenshot.nAppID,
            image_url:screenshot.strUrl
        };
    } else {
        request.Body().set_publishedfileids([id]);
        var response = await fileService.GetDetails(cmServiceHandler.CMInterface.GetServiceTransport(), request);
        var result = response.Body().publishedfiledetails()[0].toObject();
        console.log(result)
        return {
            consumer_appid: result.consumer_appid,
            image_url:result.image_url
        };
    }
}

interface ScreenshotDetails {
    consumer_appid: number,
    image_url: string
}

interface SteamService {
    tryGetScreenshotDetails: (screenshotHandle: string) => Promise<ScreenshotDetails|null>
}

export const GetSteamService = (steamClient: SteamClientHandle):SteamService => {
    return {
        tryGetScreenshotDetails: (screenshotHandle: string) => getScreenshotDetails(steamClient, screenshotHandle),
    }
};