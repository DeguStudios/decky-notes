import {
    ButtonItem,
    PanelSection,
    PanelSectionRow,
    Router
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { GalleryRoutePath, MediaRoutePath, WhiteboardRoutePath } from "../routes";

export interface ScreenshotNotification {
    ImageSrcUrl: string;
    ScreenshotHandle: string;
}

interface ScreenshotNotifier {
    registerForScreenshotNotifications: (callback: (notification: ScreenshotNotification) => void) => void;
    unregisterForScreenshotNotifications: (callback: (notification: ScreenshotNotification) => void) => void;
}

export const SideMenu: VFC<{notifier:ScreenshotNotifier}> = ({notifier}): JSX.Element => {
    const [recentImageSrc, setRecentImageSrc] = useState<string>('');
    const [recentImageHandle, setRecentImageHandle] = useState<string>('');

    useEffect(() => {
        const handleNotification = (notification:ScreenshotNotification) => {
            setRecentImageSrc(notification.ImageSrcUrl);
            setRecentImageHandle(notification.ScreenshotHandle);
        };

        notifier.registerForScreenshotNotifications(handleNotification);
        return function cleanup() {
            notifier.unregisterForScreenshotNotifications(handleNotification);
        };
    });
    
    return (
        <PanelSection title="Home">
            <PanelSectionRow>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    {recentImageSrc 
                        ? <img src={recentImageSrc} style={{width: '100%'}} />
                        : <p>No recent screenshot...</p>}                    
                </div>
                {recentImageHandle 
                    ? <ButtonItem
                        disabled={recentImageHandle 
                            ? false
                            : true}
                        layout="below"
                        onClick={() => {
                            Router.CloseSideMenus();
                            Router.Navigate(`${WhiteboardRoutePath}/${recentImageHandle}`);
                        }}>
                        Add notes to recent screenshot
                     </ButtonItem>
                    : null}                
                <ButtonItem
                    layout="below"
                    onClick={() => {
                        Router.CloseSideMenus();
                        Router.Navigate(MediaRoutePath);
                    }}>
                    Add notes to saved screenshot
                </ButtonItem>
                <ButtonItem
                    layout="below"
                    onClick={() => {
                        Router.CloseSideMenus();
                        Router.Navigate(GalleryRoutePath);
                    }}>
                    Notes
                </ButtonItem>
            </PanelSectionRow>
        </PanelSection>
    );
};