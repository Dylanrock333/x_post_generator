const validateUrl = (url) => {

    const origin = findOrigin(url);

    if (origin === null) {
        throw new Error('Invalid URL');
    }

    const videoID = findVideoID(url, origin);

    if (videoID === null) {
        throw new Error('Invalid URL');
    }
  

    return { origin, videoID };

};


const findOrigin = (url) => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();

        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            return 'youtube';
        } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
            return 'x';
        } else if (hostname.includes('instagram.com')) {
            return 'instagram';
        } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
            return 'facebook';
        } else {
            return null; 
        }
    } catch (error) {
        console.error("Invalid URL:", error);
        return null; // Handle invalid URLs
    }
};


const findVideoID = (url, origin) => {
    //TODO: add paresing for other platforms when the api is ready
    if (origin === 'youtube') {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtu.be')) {
            return parsedUrl.pathname.substring(1);
        } 
        else if (parsedUrl.hostname.includes('youtube.com')) {
            const videoID = parsedUrl.searchParams.get('v');
            return videoID;
        }
        return null; 
    }
    else {
        return null;
    }
};

export { validateUrl };

//Example URL: 
// Youtube https://www.youtube.com/watch?v=K-ri2NajcXA&t=2979s
// Youtube app URL https://youtu.be/K-ri2NajcXA
// X https://x.com/Acyn/status/1908299449505575105
//Instgram reel https://www.instagram.com/reel/DICScdLxHUC/?utm_source=ig_web_copy_link
//Instgram post video https://www.instagram.com/p/DH3TmyFy5ET/?utm_source=ig_web_copy_link
//Facebook  https://www.facebook.com/watch/?v=635608365842380
//Tiktok ?
//reddit ?  
//twitch ?
