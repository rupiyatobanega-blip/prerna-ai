
import { FacebookPage } from "../types";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

export const initFacebookSDK = () => {
  return new Promise<void>((resolve) => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : 'YOUR_FB_APP_ID', // Requires a valid FB App ID for production
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
      resolve();
    };
  });
};

export const loginWithFacebook = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.FB.login((response: any) => {
      if (response.authResponse) {
        resolve(response.authResponse.accessToken);
      } else {
        reject('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'pages_manage_posts,pages_read_engagement,publish_video' });
  });
};

export const getPages = (userAccessToken: string): Promise<FacebookPage[]> => {
  return new Promise((resolve, reject) => {
    window.FB.api('/me/accounts', { access_token: userAccessToken }, (response: any) => {
      if (response && !response.error) {
        resolve(response.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          access_token: p.access_token
        })));
      } else {
        reject(response.error);
      }
    });
  });
};

export const postPhotoToPage = async (pageId: string, pageAccessToken: string, imageBlob: Blob, caption: string) => {
  const formData = new FormData();
  formData.append('access_token', pageAccessToken);
  formData.append('source', imageBlob);
  formData.append('message', caption);

  const response = await fetch(`https://graph.facebook.com/${pageId}/photos`, {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
