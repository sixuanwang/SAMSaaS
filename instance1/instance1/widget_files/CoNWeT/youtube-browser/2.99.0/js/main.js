/*global MashupPlatform, StyledElements*/

(function () {

    "use strict";

    var _ = function _(text) {
        return text;
    };

    var build_header = function build_header(container) {

        container.addClassName('header');

        var youtube_link = document.createElement('a');
        youtube_link.href = "http://www.youtube.com";
        youtube_link.target = "_blank";
        youtube_link.innerHTML = '<img height="22" width="51" border="0" src="images/ytlogo_51x22.gif" />';

        container.appendChild(youtube_link);

        this.channel_select = new StyledElements.StyledSelect();
        container.appendChild(this.channel_select);
        this.channel_select.addEventListener('change', function (select) {
            this.youtube_source.changeOptions({base_url: select.getValue()});
        }.bind(this));

        this.pagination = new StyledElements.PaginationInterface(this.youtube_source, {
            'layout': '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><t:firstBtn/><t:prevBtn/><div class="box">Page: <t:currentPage/></div><t:nextBtn/></s:styledgui>'
        });
        container.appendChild(this.pagination);
    };

    var rebuildChannelList = function rebuildChannelList() {
        this.channel_select.clear();
        var entries = [];
        for (var i = 0; i < channels.length; i++)  {
            entries.push({label: channels[i].label, value: channels[i].url});
        }
        this.channel_select.addEntries(entries);
    };

    var make_youtube_request = function make_youtube_request(page, options, onSuccess, onFailure) {

        MashupPlatform.http.makeRequest(options.base_url, {
            method: 'GET',
            parameters: {
                'format': 5,
                'v': 2,
                'alt': 'json',
                'start-index': ((page - 1) * options.pageSize) + 1,
                'max-results': options.pageSize
            },
            onSuccess: function (response) {
                var data = JSON.parse(response.responseText);
                var response_info = {
                    'current_page': ((data.feed.openSearch$startIndex.$t - 1) / options.pageSize) + 1,
                };
                var has_next = data.feed.link.some(function (entry) { return entry.rel === 'next'; });
                if (has_next) {
                    response_info.total_count = Math.min(data.feed.openSearch$totalResults.$t, 600);
                } else {
                    response_info.total_count = response_info.current_page * options.pageSize;
                }
                var videos = data.feed.entry;
                onSuccess(videos, response_info);
            },
            onFailure: function () {
                onFailure();
            }
        });

    };

    var onentryclick = function onentryclick(video) {
        var video_info = {
            'title': video.title.$t,
            'url': video.media$group.media$content[0]
        };

        if (video.georss$where != null) {
            video_info.location = video.georss$where.gml$Point.gml$pos.$t.split(' ').join(', ');
        }
        MashupPlatform.wiring.pushEvent('video', video_info);
    };

    var paintResults = function paintResults(videos) {
        var i, entry, thumbnail, title, container;

        container = this.layout.getCenterContainer();
        container.clear();

        for (i = 0; i < videos.length; i++) {
            entry = document.createElement('div');

            thumbnail = document.createElement('img');
            thumbnail.src = videos[i].media$group.media$thumbnail[0].url;
            entry.appendChild(thumbnail);

            title = document.createElement('span');
            title.textContent = videos[i].title.$t;
            entry.appendChild(title);

            entry.addEventListener('click', onentryclick.bind(this, videos[i]), true);
            container.appendChild(entry);
        }
    };

    var YouTubeVideoSearch = function YouTubeVideoSearch() {

        MashupPlatform.wiring.registerCallback("keyword", this.doSearch.bind(this));

        MashupPlatform.widget.context.registerCallback(function (new_values) {
            if (this.layout && 'heightInPixels' in new_values) {
                this.layout.repaint();
            }
        }.bind(this));

        this.youtube_source = new StyledElements.PaginatedSource({
            'pageSize': 6,
            'requestFunc': make_youtube_request.bind(this),
            'processFunc': paintResults.bind(this)
        });

        this.youtube_source.addEventListener('requestStart', function () {
            this.layout.getCenterContainer().disable();
        }.bind(this));
        this.youtube_source.addEventListener('requestEnd', function (source, error) {
            if (error != null) {
                //this.resource_painter.setError(gettext('Connection error: No resources retrieved.'));
            }

            this.layout.getCenterContainer().enable();
        }.bind(this));
    };

    YouTubeVideoSearch.prototype.init = function init() {
        this.layout = new StyledElements.BorderLayout();

        build_header.call(this, this.layout.getNorthContainer());

        this.layout.getCenterContainer().addClassName('results loading');

        this.layout.insertInto(document.body);
        this.layout.repaint();
        this.load();
    };

    YouTubeVideoSearch.prototype.load = function load() {
        createChannels();
        rebuildChannelList.call(this);
        this.channel_select.setValue(channels[MashupPlatform.prefs.get('channel')].url);
        this.youtube_source.changeOptions({base_url: this.channel_select.getValue()});
    };

    YouTubeVideoSearch.prototype.doSearch = function doSearch(query) {

        if (!query) {
            return;
        }

        var query_url = build_search_url(query);

        this.channel_select.addEntries([{label: 'search: ' + query, value: query_url}]);
        this.channel_select.setValue(query_url);
        this.youtube_source.changeOptions({base_url: query_url});
    };

    var youtube_video_search = new YouTubeVideoSearch();
    document.addEventListener('DOMContentLoaded', youtube_video_search.init.bind(youtube_video_search), true);

    var channels = [];

    var createChannels = function createChannels() {
        channels = [
            {label: _("Popular on YouTube"), url: "http://gdata.youtube.com/feeds/api/videos?orderby=rating"},
            {label: _("Music"), url: "http://gdata.youtube.com/feeds/api/videos?category=%7Bhttp://gdata.youtube.com/schemas/2007/categories.cat%7DMusic&orderby=rating"},
            {label: _("Sports"), url: "http://gdata.youtube.com/feeds/api/videos?category=%7Bhttp://gdata.youtube.com/schemas/2007/categories.cat%7DSports&orderby=rating"},
            {label: _("Games"), url: "http://gdata.youtube.com/feeds/api/videos?category=%7Bhttp://gdata.youtube.com/schemas/2007/categories.cat%7DGames&orderby=rating"},
            {label: _("Movies"), url: "http://gdata.youtube.com/feeds/api/videos?category=%7Bhttp://gdata.youtube.com/schemas/2007/categories.cat%7DMovies&orderby=rating"}
        ];
    };

    // Search helper
    var build_search_url = function build_search_url(query) {
        return "http://gdata.youtube.com/feeds/api/videos?vq=" + encodeURIComponent(query);
    };

})();
