/*
 * OKVideo by OKFocus v1.1
 * http://okfoc.us 
 *
 * Copyright 2012, OKFocus
 * Licensed under the MIT license.
 *
 */

var player, OKEvents, options, fakeMouseOut;

(function ($) {
    
    $.okvideo = function (options) {

        if (typeof options !== 'object') options = { 'source' : options };

        var base = this;

        base.init = function () {
            base.options = $.extend({}, $.okvideo.options, options);
            
            $('body').append('<div style="position:fixed;left:0;top:0;overflow:hidden;z-index:-998;height:100%;width:100%;" id="okplayer-mask"></div><div id="okplayer" style="position:fixed;left:0;top:0;overflow:hidden;z-index:-999;height:100%;width:100%;"></div>');
            
            base.setOptions();

            if (base.options.source.provider === 'youtube') {
                base.loadYoutubeAPI();
            } else if (base.options.source.provider === 'vimeo') {
                base.loadVimeoAPI();
            }
        };
        
        base.setOptions = function () {
            for (var key in this.options){                
                if (this.options[key] === true) this.options[key] = 1;
            }            
            
            base.options.source = base.determineProvider();
            $(window).data('okoptions', base.options);
        };

        base.loadYoutubeAPI = function () {
            base.insertJS('http://www.youtube.com/player_api');
        };

        base.loadVimeoAPI = function() {
            $('#okplayer').replaceWith(function() {
                return '<iframe src="http://player.vimeo.com/video/' + base.options.source.id + '?api=1&js_api=1&title=0&byline=0&portrait=0&playbar=0&loop=' + base.options.loop + '&player_id=okplayer" frameborder="0" style="' + $(this).attr('style') + 'visibility:hidden;background-color:black;" id="' + $(this).attr('id') + '"></iframe>';
            });

            base.insertJS('http://a.vimeocdn.com/js/froogaloop2.min.js', function(){ 
                vimeoPlayerReady(); 
            });
        };

        base.insertJS = function(src, callback){
            var tag = document.createElement('script');

            if (callback){
                if (tag.readyState){  //IE
                    tag.onreadystatechange = function(){
                        if (tag.readyState == "loaded" ||
                            tag.readyState == "complete"){
                            tag.onreadystatechange = null;
                            callback();
                        }
                    };
                } else {
                    tag.onload = function() {
                        callback();
                    }
                }
            }
            tag.src = src;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        };

        base.determineProvider = function () {
            if (/youtube.com/.test(base.options.source) || /vimeo.com/.test(base.options.source)) {
                return base.parseVideoURL(base.options.source);
            } else if (/[A-Za-z0-9_]+/.test(base.options.source)) {
                var id = new String(base.options.source.match(/[A-Za-z0-9_]+/));
                if (id.length == 11) {
                    return { 'provider' : 'youtube', 'id' : id };                
                } else {
                    for (var i = 0; i < base.options.source.length; i++) {
                        if (typeof parseInt(base.options.source[i]) != 'number') {
                            throw 'not vimeo but thought it was for a sec'
                        }
                    }
                    return { 'provider' : 'vimeo', 'id' : base.options.source };
                }
            }
        };

        base.parseVideoURL = function(url) {

            var retVal = {};
            var matches;
    
            function getParm(url, param) {
                var re = new RegExp("(\\?|&)" + param + "\\=([^&]*)(&|$)");
                var matches = url.match(re);
                if (matches) {
                    return(matches[2]);
                } else {
                    return("");
                }
            }
            
            if (url.indexOf("youtube.com/watch") != -1) {
                retVal.provider = "youtube";
                retVal.id = getParm(url, "v");
            } else if (matches = url.match(/vimeo.com\/(\d+)/)) {
                retVal.provider = "vimeo";
                retVal.id = matches[1];
            } else {
                throw "OKVideo: You have not entered a valid url. Please enter a URL from Vimeo or Youtube." 
            }
            return(retVal);
        };

        base.init();
    };

    $.okvideo.options = {
        source: null,
        disableKeyControl: 1,
        captions: 0,
        loop: 1,
        hd: 1,
        volume: 0
    };

    $.fn.okvideo = function (options) {
        return this.each(function () {
            (new $.okvideo(options));
        });
    };

})(jQuery);

function vimeoPlayerReady() {
    options = $(window).data('okoptions');

    var iframe = $('#okplayer')[0];
    player = $f(iframe);
    
    // hide player until Vimeo hides controls...
    window.setTimeout($('#okplayer').css('visibility', 'visible'), 2000);
    
    player.addEvent('ready', function () {
        player.api('play');
        if ('ontouchstart' in window.touchStart) {
            // mobile devices cannot listen for play event
            OKEvents.v.onPlay();
        } else {
            player.addEvent('play', OKEvents.v.onPlay());
        }
    });
}

function onYouTubePlayerAPIReady() {
    options = $(window).data('okoptions');
    player = new YT.Player('okplayer', {
        videoId: options.source.id,
        playerVars: {
            'autohide': 1,
            'autoplay': 1,
            'disablekb': options.keyControls,
            'cc_load_policy': options.captions,
            'controls': 0,
            'enablejsapi': 1,
            'fs': 0,
            'iv_load_policy': 1,
            'loop': options.loop,
            'showinfo': 0,
            'rel': 0,            
            'wmode': 'opaque',
            'hd': options.hd
        },
        events: {
            'onReady': OKEvents.yt.ready,
            'onError': OKEvents.yt.error
        }
    });
}

OKEvents = {
    yt: {
        ready: function(event){
            event.target.setVolume(options.volume);
        },
        error: function(event){
            throw event;
        }
    },
    v: {
        onPlay: function(){            
            player.api('api_setVolume', options.volume);
        }
    }
};
