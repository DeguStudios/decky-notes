declare var SteamClient: any;

export interface UnregisterHandle {
    unregister: () => void;
}

interface ScreenshotDetails {
    hHandle: number;
    nAppID: number;
    nCreated: number;
    nHeight: number;
    nWidth: number;
    strCaption: string;
    strUrl: string;
}

interface Screenshots {
    GetLastScreenshotTaken: () => Promise<ScreenshotDetails | null>;
}

interface ScreenshotNotification {
    details: ScreenshotDetails;
    hScreenshot: number;
    strOperation: string;
    unAppID: number;
}

interface GameSessions {
    RegisterForScreenshotNotification: (callback: (notification: ScreenshotNotification) => void) => UnregisterHandle;
}

interface SteamClientHandle {
    Screenshots: Screenshots;
    GameSessions: GameSessions;
}

export const GetSteamClient = ():SteamClientHandle => {
    return SteamClient as SteamClientHandle;
}