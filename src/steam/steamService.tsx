import { findModuleChild } from "decky-frontend-lib";

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

const getScreenshotDetails = async (screenshotHandle: string): Promise<ScreenshotDetails> => {
    var request = packetGenerator.Init(fileDetailsRequestBlueprint);
    const prefix = screenshotHandle.includes('local') ? 'local' : 'remote';
    const id = screenshotHandle.substring(prefix.length + 1);
    request.Body().set_publishedfileids([id]);
    var response = await fileService.GetDetails(cmServiceHandler.CMInterface.GetServiceTransport(), request);
    var result = response.Body().publishedfiledetails()[0].toObject();
    console.log(result)
    return {
        consumer_appid: result.consumer_appid,
        image_url:result.image_url
    };
}

interface ScreenshotDetails {
    consumer_appid: number,
    image_url: string
}

interface SteamService {
    getScreenshotDetails: (screenshotHandle: string) => Promise<ScreenshotDetails>
}

export const GetSteamService = ():SteamService => {
    return {
        getScreenshotDetails: getScreenshotDetails,
    }
};