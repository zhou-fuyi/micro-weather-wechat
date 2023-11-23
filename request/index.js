import { APP_CONFIG } from '../config/app.config'

export const request = (params) => {
    let {url} = params;
    if(!String(url).startsWith('https')){
        if(String(url).startsWith('/')){
            url = String(url).substring(1, String(url).length)
        }
        url = APP_CONFIG.base_url + url
    }
    return new Promise((resolve, reject) => {
        wx.request({
            ...params,
            header: {
                'Authorization': wx.getStorageSync(APP_CONFIG.constants.auth_token)
            },
            url,
            success: (response) => {
                if(response.data.code === 200){
                    resolve(response.data)
                }else {
                    reject(response.data)
                }
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}