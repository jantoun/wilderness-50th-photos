define(["dojo/has",
	"esri/tasks/GeometryService",
	"storymaps/utils/Helper",
	"storymaps/playlist/core/mobile/Layout",
	"storymaps/playlist/ui/Map",
	"storymaps/playlist/ui/List",
	"lib/jquery/jquery-1.10.2.min",
	"lib/jquery.waitforimages.js"],
	function(has,
		GeometryService,
		Helper,
		MobileLayout,
		Map,
		List){

		/**
		* Core
		* @class Core
		*
		* Main class for story map application
		*
		* Dependencies: Jquery 1.10.2
		*/

		var _embed = (top != self) ? true : false,
		_msie = window.navigator.userAgent.indexOf('MSIE '),
		_trident = window.navigator.userAgent.indexOf('Trident/'),
		_mobile = has("touch"),
		_mobileLayout,
		_kioskMode,
		_readyState = {
			map: false,
			list: false,
			images: false
		},
		_layersReady = 0,
		_map,
		_list;

		function init ()
		{
			if (configOptions.sharingUrl && location.protocol === "https:"){
				configOptions.sharingUrl = configOptions.sharingUrl.replace('http:', 'https:');
			}

			if (configOptions.geometryServiceUrl && location.protocol === "https:"){
				configOptions.geometryServiceUrl = configOptions.geometryServiceUrl.replace('http:', 'https:');
			}

			esri.arcgis.utils.arcgisUrl = configOptions.sharingUrl;
			esri.config.defaults.io.proxyUrl = configOptions.proxyUrl;
			esri.config.defaults.geometryServiceUrl = new GeometryService(configOptions.geometryServiceUrl);

			var urlObject = esri.urlToObject(document.location.href);
			urlObject.query = urlObject.query || {};

			if(urlObject.query.kiosk || urlObject.query.kiosk === ''){
				_kioskMode = true;
				$('body').addClass('kiosk');
				Helper.startUpIdleTimer();
			}

			if (_embed){
				$("#banner").hide();
				$("#side-pane-buffer").hide();
			}
			if (_embed || (_mobile && !_kioskMode)){
				_mobileLayout = new MobileLayout(onMobileListOpen);
			}
			else{
				$('body').addClass('desktop');
			}

			if (_msie > 0 || _trident > 0){
				$('#title').css('margin-top','24px');
			}

			Helper.enableRegionLayout();

			_map = new Map(_mobile,_kioskMode,configOptions.geometryServiceUrl,configOptions.bingMapsKey,configOptions.webmap,configOptions.excludedLayers,configOptions.dataFields,configOptions.playlistLegend.visible,configOptions.playlistLegend,"map","playlist-legend","legend","#side-pane",onMapLoad,onMapLegendHide,onLayersUpdate,onMarkerOver,onMarkerOut,onMarkerSelect,onMarkerRemoveSelection,onFilterTogglesReady),
			_list = new List("#playlist","#search","#filter-content",configOptions.dataFields,onListLoad,onListGetTitleAttr,onListSelect,onListHighlight,onListRemoveHighlight,onListSearch);

			loadMap();

			$("#startOver").click(function(){
				window.location = "http://storymaps.esri.com/stories/2014/wilderness-start-page/";
			});
		}


		// MAP FUNCTIONS
		
		function loadMap()
		{
			Helper.updateLoadingMessage("Loading map");
			_map.init();
		}

		function onMapLoad()
		{
			if (!_readyState.map){
				updateText();
				_readyState.map = true;
				if (_layersReady === _map.getLayerCount()){
					_readyState.list = true;
				}
				checkReadyState();
			}
		}

		function onMapLegendHide()
		{
			$("#legend-wrapper").hide();
			$(".toggle-legend").hide();
		}

		function onLayersUpdate(graphics)
		{
			if (_list){
				updatePlaylist(graphics);
			}
		}

		function onMarkerOver(item)
		{
			if(_list){
				_list.highlight(item);
			}
		}

		function onMarkerOut(item)
		{
			if(_list){
				_list.removeHighlight(item);
			}
		}

		function onMarkerSelect(item)
		{
			if(_list){
				_list.select(item);
			}
		}

		function onMarkerRemoveSelection()
		{
			if(_list){
				_list.removeSelection();
			}
		}

		function onFilterTogglesReady()
		{
			if(_list){
				_list.initFilter();
			}
		}


		// LIST FUNCTIONS

		function onListLoad()
		{
			if (!_readyState.list){
				_layersReady++;
				$(".playlist-item .thumbnail-container").waitForImages({
					finished: function(){
						_readyState.images = true;
						checkReadyState();
					},
					waitForAll: true
				});
				if (_layersReady === _map.getLayerCount()){
					_readyState.list = true;
					checkReadyState();
				}
			}
		}

		function onListGetTitleAttr(titleObj)
		{
			if(_map){
				_map.setTitleAttr(titleObj);
			}
		}

		function onListSelect(item,sameItem)
		{
			if(_map && !sameItem){
				_map.select(item);
			}
			if(_mobile && sameItem){
				_mobileLayout.hideList();
			}
		}

		function onListHighlight(item)
		{
			if(_map){
				_map.highlight(item);
			}
		}

		function onListRemoveHighlight()
		{
			if(_map){
				_map.removeHighlight();
			}
		}

		function onListSearch(items)
		{
			if(_map){
				_map.filterGraphics(items);
			}
		}

		function updatePlaylist(graphics)
		{
			Helper.updateLoadingMessage("Updating Playlist");
			_list.update(graphics);
		}

		// Mobile events
		function onMobileListOpen()
		{
			if(_map){
				_map.resizeMap();
			}
		}

		function updateText(title,subtitle,description)
		{
			var descriptionText = configOptions.description || description || "";
			document.title = configOptions.title || title || "";
			// $(".title-text").html(configOptions.title || title || "");
			$(".subtitle-text").html(configOptions.subtitle || subtitle || "");
			$("#description").html(descriptionText);

			if (descriptionText){
				$("body").addClass("show-description");
			}
			else{
				$("#side-pane-controls .toggle-description").hide();
			}
		}

		function checkReadyState()
		{
			var ready = true;

			for (var i in _readyState){
				if (!_readyState[i]){
					ready = false;
				}
			}
			appReady(ready);
		}

		function appReady(ready)
		{
			if (ready){
				Helper.resetRegionLayout();
				Helper.removeLoadScreen();

				addSidePaneEvents();
			}
		}

		function addSidePaneEvents()
		{
			$(".playlist-control").click(function(){
				if ($(this).hasClass("toggle-side-pane")){
					$("#side-pane").toggleClass("minimized");
				}
				else if ($(this).hasClass("toggle-legend")){
					$("body").toggleClass("show-legend");
					if ($("body").hasClass("show-description")){
						$("body").removeClass("show-description");
					}
				}
				else if ($(this).hasClass("toggle-description")){
					$("body").toggleClass("show-description");
					if ($("body").hasClass("show-legend")){
						$("body").removeClass("show-legend");
					}
				}
				Helper.resetRegionLayout();
			});
		}

		return {
			init: init
		};
});