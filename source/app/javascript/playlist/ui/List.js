define(["dojo/_base/array",
	"dojo/has",
	"storymaps/playlist/core/Data",
	"lib/jquery/jquery-1.10.2.min",
	"lib/jquery.autoellipsis-1.0.10.min",
	"lib/jquery-ui-1.10.3.custom.min"], 
	function(array,
		has,
		Data){
	/**
	* Playlist List
	* @class Playlist List
	* 
	* Class to define a new item list in the playlist app
	*
	* Dependencies: Jquery 1.10.2
	*/

	var titleField = "title";
	var photoField = "photo";
	var photoIdField = "id";

	return function List(selector,searchSelector,filterSelector,dataFields,onLoad,onGetTitleField,onSelect,onHighlight,onRemoveHightlight,onSearch)
	{
		var _listEl = $(selector),
		_filterSet = [],
		_searchResults;

		addSearchEvents();

		this.update = function(lyrItems)
		{
			_listEl.empty();
			$(".playlist-item").unbind("click");
			buildList(lyrItems);

			onLoad();
		};

		this.highlight = function(item)
		{
			$(".playlist-item[layer-id=" + item.layerId + "][object-id=" + item.objectId + "]").addClass("highlight");
		};

		this.removeHighlight = function()
		{
			$(".playlist-item").removeClass("highlight");
		};

		this.select = function(item)
		{
			var element = $(".playlist-item[layer-id=" + item.layerId + "][object-id=" + item.objectId + "][photo-id=" + item.photoId + "]");
			if (element.length > 0){
				var itemTop = element.position().top;
				$(".playlist-element").removeClass("selected");
				element.addClass("selected");

				if (itemTop < 0){
					$(selector).scrollTop($(selector).scrollTop() + itemTop);
				}
				else if (itemTop + element.height() > $(selector).height()){
					$(selector).scrollTop($(selector).scrollTop() + itemTop - $(selector).height() + element.height());
				}
			}
		};

		this.removeSelection = function()
		{
			$(".playlist-item").removeClass("selected");
		};

		this.initFilter = function()
		{
			addFilterEvents();
		};

		function addSearchEvents()
		{
			if (searchSelector){

				$(searchSelector).autocomplete({
					source: function(request,response){
						var regex = new RegExp($.ui.autocomplete.escapeRegex(request.term),"i");

						var result = $.grep($(".playlist-item"),function(el){
							return ($(el).find(".item-title div").html().match(regex));
						});

						_searchResults = result;

						response(result);
					},
					response: function(){
						$(".playlist-item").addClass("hidden-search");
						$(_searchResults).each(function(){
							$(this).removeClass("hidden-search");
						});
						$("#search-submit").addClass("icon-close").removeClass("icon-search");
						setItemResults();						
					},
					close: function(){
						if ($(searchSelector).val() === ""){
							$(".playlist-item").removeClass("hidden-search");
							$("#search-submit").addClass("icon-search").removeClass("icon-close");	
							setItemResults();
						}
					},
					change: function(){
						if ($(searchSelector).val() === ""){
							$(".playlist-item").removeClass("hidden-search");
							$("#search-submit").addClass("icon-search").removeClass("icon-close");
							setItemResults();
						}
					}
				});

				$(searchSelector).blur(function(){					
					if ($(searchSelector).val() === ""){
						$(".playlist-item").removeClass("hidden-search");
						$("#search-submit").addClass("icon-search").removeClass("icon-close");
						setItemResults();
					}
				});

				$("#search-submit").click(function(){
					if ($(this).hasClass("icon-close")){
						$(searchSelector).val("");
						$(".playlist-item").removeClass("hidden-search");
						$(this).addClass("icon-search").removeClass("icon-close");
						setItemResults();	
					}
				});
			}
		}

		function buildList(lyrItems)
		{
			for (var layerId in lyrItems){
				var items = lyrItems[layerId];
				var attr = getAttributeNames(items[0].graphic.attributes);
				var titleAttr = {
					layerId: layerId,
					fieldName: attr.title
				};
				onGetTitleField(titleAttr);
				array.forEach(items,function(item){
					array.forEach(Data.photos,function(photoObj){
						if(photoObj.wilderness === item.graphic.attributes.wilderness){
							var objId = item.graphic.attributes[item.objectIdField];
							var itemStr = '\
								<div class="playlist-item" layer-id="' + layerId + '" object-id="' + objId + '" photo-id="' + photoObj[photoIdField] + '" data-filter="' + photoObj.photoCategory + '">\
									<table>\
										<tbody>\
											<tr>\
												<td class="marker-cell">\
													<img src="' + getIcon(photoObj.photoCategory) + '" alt="" class="marker" />\
												</td>\
												<td class="thumbnail-cell">\
													<div class="thumbnail-container" style="background-image: url(resources/images/contest-photos/small/' + photoObj[photoField] + '); background-position: ' + photoObj.thumbnailPosition + '; filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="resources/images/contest-photos/' + photoObj[photoField] + '", sizingMethod="scale");"></div>\
												</td>\
												<td class="title-cell">\
													<h6 class="item-title">' + photoObj[titleField] + '</h6>\
													<h6 class="item-photographer">' + photoObj.photographer + '</h6>\
												</td>\
											</tr>\
										</tbody>\
									</table>\
								</div>\
							';
							if ($.inArray(item.filter,_filterSet) < 0){
								addNewFilter(item.filter);
							}
							_listEl.append(itemStr);
						}
					});
				});			
			}
			$(".item-title").ellipsis();

			addEvents();

			$(".playlist-item").sort(function (a, b){
				return ($(b).data('filter')) < ($(a).data('filter')) ? 1 : -1;    
			}).appendTo('#playlist');
			
		}

		function addNewFilter(filter)
		{
			_filterSet.push(filter);

			$(filterSelector).append('<label class="filter-select">' + filter + '<input type="checkbox" checked></label>');
			$(".filter-select").last().click(function(){
				if ($(this).find("input").prop("checked")){
					$(".playlist-item[data-filter='" + filter + "']").removeClass("hidden-filter");
				}
				else{
					$(".playlist-item[data-filter='" + filter + "']").addClass("hidden-filter");
				}
				setItemResults();
			});

			if (_filterSet.length > 1){
				$(searchSelector).css("width",240);
				$("#search-submit").css("right",45);
				$("#filter-wrapper").show();
			}
		}

		function addEvents()
		{
			$(".playlist-item").click(function(){
				if ($(this).hasClass("selected")){
					onSelect(item,true);
				}
				else{
					$(".playlist-item").removeClass("selected");
					$(this).addClass("selected");
					var item = {
						layerId: $(this).attr("layer-id"),
						objectId: $(this).attr("object-id"),
						photoId: $(this).attr("photo-id")
					};
					onSelect(item,false);
				}
			});

			if(!has("touch")){
				$(".playlist-item").mouseover(function(){
					$(".playlist-item").removeClass("highlight");
					$(this).addClass("highlight");
					var item = {
						layerId: $(this).attr("layer-id"),
						objectId: $(this).attr("object-id")
					};
					
					onHighlight(item);
				});

				$(selector).mouseout(function(){
					$(".playlist-item").removeClass("highlight");
					onRemoveHightlight();
				});
			}

			$(".select-all").click(function(){
				if ($(this).find("input").prop("checked")){
					$(".filter-select input").prop("checked", true);
					$(".playlist-item").removeClass("hidden-filter");

				}
				else{
					$(".filter-select input").prop("checked", false);
					$(".playlist-item").addClass("hidden-filter");
				}
				setItemResults();
			});
		}

		function addFilterEvents()
		{
			$('.filterRow').click(function(){
				$(this).toggleClass('items-off');
				if ($(this).hasClass('items-off')){
					$(".playlist-item[data-filter='" + $(this).attr('data-filter') + "']").addClass("hidden-filter");
				}
				else{
					$(".playlist-item[data-filter='" + $(this).attr('data-filter') + "']").removeClass("hidden-filter");
				}
				setItemResults();
			});

			$('#filterAll').click(function(){
				if ($('.filterRow.items-off').length < $('.filterRow').length){
					$('.filterRow').addClass('items-off');
					$(".playlist-item").addClass("hidden-filter");
				}
				else{
					$('.filterRow').removeClass('items-off');
					$(".playlist-item").removeClass("hidden-filter");
				}
				setItemResults();
			});
		}

		function setItemResults()
		{
			var items = [];
			if ($(".playlist-item:hidden").length > 0){
				if ($(".playlist-item:visible").length > 0){
					$(".playlist-item:visible").each(function(){
						var item = {
							layerId: $(this).attr("layer-id"),
							objectId: $(this).attr("object-id")
						};
						items.push(item);
					});
				}
				else{
					items = null;
				}
			}
			onSearch(items);
		}

		function getIcon(category)
		{
			var iconURL;

			if(category){
				if (category.toLowerCase() === 'wildlife'){
					iconURL = "resources/images/markers/wilderness/IconTerra1.png";
				}
				else if (category.toLowerCase() === 'people in wilderness'){
					iconURL = "resources/images/markers/wilderness/IconBlue1.png";
				}
				else if (category.toLowerCase() === 'most inspirational moment'){
					iconURL = "resources/images/markers/wilderness/IconRed1.png";
				}
				else if (category.toLowerCase() === 'scenic landscape'){
					iconURL = "resources/images/markers/wilderness/IconOchre1.png";
				}
				else{
					iconURL = "resources/images/markers/wilderness/IconPurple1.png";
				}
			}

			return iconURL;
		}

		function getAttributeNames(obj)
		{
			var attrNames = {},
			udrScr = new RegExp (/"_"/i),
			url = new RegExp (/http/i),
			img = new RegExp (/(?:.jpe?g|.gif|.png)/i);

			for (var prop in obj){
				if (typeof(obj[prop]) === 'string'){
					if (prop === "title"){
						attrNames.title = "title";
					}
					else if (prop === "Title"){
						attrNames.title = "Title";
					}
					else if (prop === "TITLE"){
						attrNames.title = "TITLE";
					}
					else if (prop === "name"){
						attrNames.title = "name";
					}
					else if (prop === "Name"){
						attrNames.title = "Name";
					}
					else if (prop === "NAME"){
						attrNames.title = "NAME";
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "thumbnail";
					}
					else if (prop === "Thumbnail"){
						attrNames.thumbnail = "Thumbnail";
					}
					else if (prop === "thumbnail"){
						attrNames.thumbnail = "THUMBNAIL";
					}
					else if (prop === "thumb_url"){
						attrNames.thumbnail = "thumb_url";
					}
					else if (prop === "Thumb_Url"){
						attrNames.thumbnail = "Thumb_Url";
					}
					else if (prop === "Thumb_URL"){
						attrNames.thumbnail = "Thumb_URL";
					}
					else if (prop === "THUMB_URL"){
						attrNames.thumbnail = "THUMB_URL";
					}
					else if (img.test(obj[prop]) && url.test(obj[prop])){
						if(!attrNames.thumbnail){
							attrNames.thumbnail = prop;
						}
					}
					else if (!udrScr.test(obj[prop]) && obj[prop].length > 1 && !url.test(obj[prop])){
						if(!attrNames.title){
							attrNames.title = prop;
						}
					}
				}
			}

			if (dataFields.imageField){
				attrNames.thumbnail = dataFields.imageField;
			}
			if (dataFields.nameField){
				attrNames.title = dataFields.nameField;
			}

			return attrNames;
		}

	};

});