$(document).ready(function(){
    
    if(navigator.onLine){
    
        // Set Listener's
        $('li#toggleAdd').click(function(){
            toggleadd(function(){});
        });

        $('li#buttonAddContainer').click(function(){
            addContent($('input#linkInput').val());
        });

        $('li.action#rescan').click(function(){
            scan(function(links){         
                adjustClipboardButtons(links);
            });     
        });
    }
    
    $('li.action#closePopup').click(function(){
        
        var subElements = $('li.item').filter(function(){
           return $(this).attr('id') != 'enterLink'; 
        });
        
        subElements.toggle(500, function(){
            console.log('Displayed sub [ID:' + $(this).attr("id") + '] successfully.');
        }); 
        
        subElements.promise().done(function(){ window.close() });
    });
    
});

function displaySubscriptions(onFinish){
    
    var subElements = $();
    const TOGGLE_DURATION = 500;
    
    getYLinks(function(ylinks){
        
        if(ylinks.subscriptions.length === 0){
            insertDummySub(function(){
                return; 
            });
        }
        
        var subChannelGET = $.get('subChannel.html');
        var subPlaylistGET = $.get('subPlaylist.html');
        
        $.when(subChannelGET, subPlaylistGET).done(function(subChannelHTML, subPlaylistHTML){
            
            $.each(ylinks.subscriptions, function(i, subEntry){
                
                channelElement = $(subChannelHTML[0]);
                playlistElement = $(subPlaylistHTML[0]);
               
                if( subEntry.type === CONTENT_TYPE_CHANNEL && subChannelHTML[1] === 'success' ){
                    
                    //Personalize the channel item
                    channelElement.attr('id', subEntry.id);
                    channelElement.attr('type', subEntry.type);
                    channelElement.find('img').attr('src', subEntry.info.thumbnail);
                    channelElement.find('a.subTitle').text(subEntry.info.title);
                    channelElement.find('a.count:first').text(subEntry.statistics.subscriberCount);
                    channelElement.find('a.count:last').text(subEntry.statistics.videoCount);

                    assignListenersToSubElement(channelElement); 
                    
                    subElements = subElements.add(channelElement);
                    
                }else if( subEntry.type === CONTENT_TYPE_PLAYLIST && subPlaylistHTML[1] === 'success' ){
                    
                    //Personalize the playlist item
                    playlistElement.attr('id', subEntry.id);
                    playlistElement.attr('type', subEntry.type);
                    playlistElement.find('img').attr('src', subEntry.info.thumbnail);
                    playlistElement.find('a.subTitle').text(subEntry.info.title);
                    
                    subElements = subElements.add(playlistElement);
                }
                
            });
            
            subElements.insertAfter( $("li#enterLink") );

            subElements.slideToggle(TOGGLE_DURATION, function(){
                console.log('Displayed sub (ID:' + $(this).attr("id") + ') successfully.');
            }); 

            subElements.promise().done(function(){ 
                onFinish();
            });
            
        }).fail(function(response){
            
            console.error(response);
            onFinish();
        });
        
    });

}



function insertChannel(newChannel, onInserted){
    
    const TOGGLE_DURATION = 500;
    
    //GET HTML content for one subscription item
    $.get('subChannel.html', function(subChannelHTML){

        //Parse HTML-String into JQuery-Object
        subElement = $(subChannelHTML);

        //Personalize the subscription item
        subElement.attr('id', newChannel.id);
        subElement.attr('type', newChannel.type);
        subElement.find('img').attr('src', newChannel.info.thumbnail);
        subElement.find('a.subTitle').text(newChannel.info.title);
        subElement.find('a.count:first').text(newChannel.statistics.subscriberCount);
        subElement.find('a.count:last').text(newChannel.statistics.videoCount);

        assignListenersToSubElement(subElement); 

        subElement.insertAfter( $("li#enterLink") );

        subElement.slideToggle(TOGGLE_DURATION, function(){
            
            console.log('Displayed channel [ID:' + $(this).attr("id") + '] successfully.');
            animatePulse('green', $(this));
            onInserted();
        }); 
    });
    
}

function insertPlaylist(newPlaylist, onInserted){
    
    onInserted();
}

function assignListenersToSubElement(element){
    
    $(element).hover(itemHoverIn, itemHoverOut);
    $(element).find('div.subAction#removeSub').hover(removeHoverIn, removeHoverOut);
    
    $(element).find('li.buttonClipboard').click(function(){
        
        var item = $(this).parents('li.item');
        copyToClipboard(item.attr('id'), item.attr('type'));
    });
    
    $(element).find('div.subAction#removeSub').click(function(){
        
        var item = $(this).parents('li.item');
        removeSub(item.attr('id'), item.attr('type'));
    });
    
    $(element).find('div.subAction#resetHistorySub').click(function(){
        
        var item = $(this).parents('li.item');
        resetHistory(item.attr('id'), item.attr('type'));  
    });
    
    $(element).find('li.channelThumbnail, a.channelTitle').click(function(){
        
        var item = $(this).parents('li.item');
        var id = item.attr('id');
        var type = item.attr('type');
        
        if(type === CONTENT_TYPE_CHANNEL){
            openChannel(id);
        }else if(type === CONTENT_TYPE_PLAYLIST){
            openPlaylist(id);
        }
    });
}

function removeOldSub(channelID, onFinish){
    
    var oldSub = $("li[id = '"+channelID+"']");
    
    oldSub.slideToggle(300, function(){
        oldSub.remove();
        onFinish();
    });
}

function insertDummySub(onFinish){
    
    $("ul#subscriptionContainer").append( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription',
        'style' : 'display:none;'
    })); 
    
    $("li#dummySubscription").slideToggle(300, function(){
        onFinish();
    });
}

function removeDummySub(){
    
    var dummySub = $('li#dummySubscription');
    
    if(dummySub != undefined){
        dummySub.slideToggle(500, function(){
            dummySub.remove();
        });
    }
}

function toggleadd(onFinish){
    
    var $buttonadd = $('li#toggleAdd');
    var $enterLink = $('li#enterLink');
    
    if( $enterLink.css('display') == 'none' ){
        $buttonadd.find('a').text('Cancel');
        $buttonadd.find('i.material-icons').text('remove_circle');
    }else{
        $buttonadd.find('a').text('Add Channel / Playlist');
        $buttonadd.find('i.material-icons').text('subscriptions');
    }
    
    $enterLink.slideToggle(300, function(){
        $('input#linkInput').val('');
        onFinish();
    });
}

function animatePulse(color, element){

    var className;
    
    if(!element) return;
    
    if(color == 'red'){
        className = 'animatedPulseRed';
    }else if(color == 'green'){
        className = 'animatedPulseGreen';
    }else{
        return;
    }
    
    element.addClass(className);
    
    setTimeout(function(){
        element.removeClass(className);
    }, 1000);
}

function removeSub(id, type){
    
    if(type === CONTENT_TYPE_CHANNEL){
        removeChannel(id);
    }else if(type === CONTENT_TYPE_PLAYLIST){
        removePlaylist(id);
    }
}

function copyToClipboard(id, type){
    
    var linksField, cpHistField, linksIndex, cpHistIndex;
    
    var linkContainer = $('input#linkContainer');
    
    getYLinks(function(ylinks){
        
        if(type === CONTENT_TYPE_CHANNEL){
            linksField = ylinks.links.channels;
            cpHistField = ylinks.copyHistory.channels;
        }else if(type === CONTENT_TYPE_PLAYLIST){
            linksField = ylinks.links.playlists;
            cpHistField = ylinks.copyHistory.playlists;
        }
        
        linksIndex  = linksField.findIndex( l => l.id === id );
        cpHistIndex = cpHistField.findIndex( cH => cH.id === id );
        
        //Fill invisible textfiled with link's seperated by space
        $.each(linksField[linksIndex].videoLinks, function(i, link){
            linkContainer.val(linkContainer.val() + 'www.youtube.com/watch?v=' + link + ' ');
            cpHistField[cpHistIndex].videoLinks.push(link);
        });
        
        linksField[linksIndex].videoLinks = [];
        
        //Copy content from invisible textfield to clipboard
        linkContainer.select();
        document.execCommand('copy');
        
        updateYLinks(ylinks, function(){
            adjustClipboardButtons(ylinks.links);
        });
        
    });
    
}

function adjustClipboardButtons(links){
    
    var clipboardButton, clipboardIcon;
    var linkAmount;
    const ANIMATION_DURATION = 1000;
    
    $.each(links, function(key, linksField){
        
        $.each(linksField, function(i, linkEntry){
            
            linkAmount      = linkEntry.videoLinks.length;
            clipboardButton = $("li[id = '"+linkEntry.id+"']").find('li.buttonClipboard');
            clipboardIcon   = clipboardButton.find('i.material-icons');

            if(clipboardIcon || clipboardIcon.length === 1){

                if(linkAmount === 0){

                    clipboardIcon.text('filter_none');
                    clipboardButton.css('cursor', 'default');
                    clipboardButton.animate({ backgroundColor: "#a3a3a3" }, ANIMATION_DURATION );
                    clipboardIcon.animate({ color: '#e62117' }, ANIMATION_DURATION);

                }else if(linkAmount > 9){

                    clipboardIcon.text('filter_9_plus');
                    clipboardButton.css('cursor', 'pointer');
                    clipboardButton.animate({ backgroundColor: "#e62117" }, ANIMATION_DURATION );
                    clipboardIcon.animate({ color: '#fff' }, ANIMATION_DURATION);

                }else{
                    clipboardIcon.text('filter_'+linkAmount);
                    clipboardButton.css('cursor', 'pointer');
                    clipboardButton.animate({ backgroundColor: "#e62117" }, ANIMATION_DURATION );
                    clipboardIcon.animate({ color: '#fff' }, ANIMATION_DURATION);
                }
            }
            
        });
        
    });
}

var itemHoverIn = function(){
    
    $(this).css('background-color', '#f2f2f2');
    $(this).find('li.subDescription').css('background-color', '#f2f2f2');
    $(this).find('div.subAction').css('background-color', '#f2f2f2');
    $(this).find('div.subActionContainer').css('display', 'flex');
}

var itemHoverOut = function(){
    
    $(this).css('background-color', '#fff');
    $(this).find('li.subDescription').css('background-color', '#fff');
    $(this).find('div.subAction').css('background-color', '#fff');
    $(this).find('div.subActionContainer').css('display', 'none');
}

var removeHoverIn = function(){
    
    $(this).find('i.material-icons').addClass('red');
}

var removeHoverOut = function(){
    
    $(this).find('i.material-icons').removeClass('red');
}

function setPopupOffline(){
    
    $('li.action#toggleAdd').hide();
    $('li.action#rescan').hide();
    $('li.action#resetCopyHistory').hide();
    $('div#offline').css('display', 'flex');
    $('ul.container#actionContainer').css('flex-flow', 'column');
    $('li.action#closePopup').css('align-self', 'flex-end');
}


