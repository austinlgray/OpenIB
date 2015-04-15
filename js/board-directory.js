// ============================================================
// Purpose                      : Board directory handling
// Contributors                 : 8n-tech
// ============================================================

;( function( window, $, undefined ) {
	var boardlist = {
		options : {
			$boardlist : false,
			
			// Selectors for finding and binding elements.
			selector   : {
				'boardlist'     : "#boardlist",
				
				'board-head'    : ".board-list-head",
				'board-body'    : ".board-list-tbody",
				'board-loading' : ".board-list-loading",
				
				'search'        : "#search-form",
				'search-lang'   : "#search-lang-input",
				'search-sfw'    : "#search-sfw-input",
				'search-tag'    : "#search-tag-input",
				'search-title'  : "#search-title-input",
				'search-submit' : "#search-submit",
				
				'tag-link'      : ".tag-link"
			},
			
			// HTML Templates for dynamic construction
			template   : {
				// Board row item
				'board-row'          : "<tr></tr>",
				
				// Individual cell definitions
				'board-cell-meta'    : "<td class=\"board-meta\"></td>",
				'board-cell-uri'     : "<td class=\"board-uri\"></td>",
				'board-cell-title'   : "<td class=\"board-title\"></td>",
				'board-cell-pph'     : "<td class=\"board-pph\"></td>",
				'board-cell-posts_total' : "<td class=\"board-max\"></td>",
				'board-cell-active'  : "<td class=\"board-unique\"></td>",
				'board-cell-tags'    : "<td class=\"board-tags\"></td>",
				
				// Content wrapper
				// Used to help constrain contents to their <td>.
				'board-content-wrap' : "<div class=\"board-cell\"></div>",
				
				'board-datum-lang'   : "<span class=\"board-lang\"></span>",
				'board-datum-uri'    : "<a class=\"board-link\"></a>",
				'board-datum-sfw'    : "<i class=\"fa fa-briefcase board-sfw\" title=\"SFW\"></i>",
				'board-datum-nsfw'   : "<i class=\"fa fa-briefcase board-nsfw\" title=\"NSFW\"></i>",
				'board-datum-tags'   : "<a class=\"tag-link\" href=\"#\"></a>"
			}
		},
		
		lastSearch : {},
		
		bind : {
			form : function() {
				var selectors = boardlist.options.selector;
				
				var $search       = $( selectors['search'] ),
				    $searchLang   = $( selectors['search-lang'] ),
				    $searchSfw    = $( selectors['search-sfw'] ),
				    $searchTag    = $( selectors['search-tag'] ),
				    $searchTitle  = $( selectors['search-title'] ),
				    $searchSubmit = $( selectors['search-submit'] );
				
				var searchForms   = {
						'boardlist'    : boardlist.$boardlist,
						'search'       : $search,
						'searchLang'   : $searchLang,
						'searchSfw'    : $searchSfw,
						'searchTag'    : $searchTag,
						'searchTitle'  : $searchTitle,
						'searchSubmit' : $searchSubmit
					};
				
				if ($search.length > 0) {
					// Bind form events.
					boardlist.$boardlist
						// Tag click
						.on( 'click', selectors['tag-link'], searchForms, boardlist.events.tagClick )
						// Form Submission
						.on( 'submit', selectors['search'], searchForms, boardlist.events.searchSubmit )
						// Submit click
						.on( 'click', selectors['search-submit'], searchForms, boardlist.events.searchSubmit );
						
					$searchSubmit.prop( 'disabled', false );
				}
			}
		},
		
		build  : {
			boardlist : function(data) {
				boardlist.build.boards(data['boards'], data['order']);
				boardlist.build.lastSearch(data['search']);
				boardlist.build.tags(data['tags']);
				
			},
			
			boards : function(data, order) {
				// Find our head, columns, and body.
				var $head = $( boardlist.options.selector['board-head'], boardlist.$boardlist ),
				    $cols = $("[data-column]", $head ),
				    $body = $( boardlist.options.selector['board-body'], boardlist.$boardlist );
				
				$.each( order, function( index, uri ) {
					var row  = data[uri];
					    $row = $( boardlist.options.template['board-row'] );
					
					$cols.each( function( index, col ) {
						boardlist.build.board( row, col ).appendTo( $row );
					} );
					
					$row.appendTo( $body );
				} );
			},
			board : function(row, col) {
				var $col   = $(col),
				    column = $col.attr('data-column'),
				    value  = row[column]
				    $cell  = $( boardlist.options.template['board-cell-' + column] ),
				    $wrap  = $( boardlist.options.template['board-content-wrap'] );
				
				if (typeof boardlist.build.boardcell[column] === "undefined") {
					if (value instanceof Array) {
						if (typeof boardlist.options.template['board-datum-' + column] !== "undefined") {
							$.each( value, function( index, singleValue ) {
								$( boardlist.options.template['board-datum-' + column] )
									.text( singleValue )
									.appendTo( $wrap );
							} );
						}
						else {
							$wrap.text( value.join(" ") );
						}
					}
					else {
						$wrap.text( value );
					}
				}
				else {
					var $content = boardlist.build.boardcell[column]( row, value );
					
					if ($content instanceof jQuery) {
						// We use .append() instead of .appendTo() as we do elsewhere
						// because $content can be multiple elements.
						$wrap.append( $content );
					}
					else if (typeof $content === "string") {
						$wrap.html( $content );
					}
					else {
						console.log("Special cell constructor returned a " + (typeof $content) + " that board-directory.js cannot interpret.");
					}
				}
				
				$wrap.appendTo( $cell );
				return $cell;
			},
			boardcell : {
				'meta' : function(row, value) {
					return $( boardlist.options.template['board-datum-lang'] ).text( row['locale'] );
				},
				'uri'  : function(row, value) {
					var $link = $( boardlist.options.template['board-datum-uri'] ),
						$sfw  = $( boardlist.options.template['board-datum-' + (row['sfw'] == 1 ? "sfw" : "nsfw")] );
					
					$link
						.attr( 'href', "/"+row['uri']+"/" )
						.text( "/"+row['uri']+"/" );
					
					// I decided against NSFW icons because it clutters the index.
					// Blue briefcase = SFW. No briefcase = NSFW. Seems better.
					if (row['sfw'] == 1) {
						return $link[0].outerHTML + $sfw[0].outerHTML;
					}
					else {
						return $link[0].outerHTML;
					}
				}
			},
			
			lastSearch : function(search) {
				return boardlist.lastSearch =  { 
					'lang'  : search.lang === false ? "" : search.lang,
					'page'  : search.page,
					'tags'  : search.tags === false ? "" : search.tags.join(" "),
					'time'  : search.time,
					'title' : search.title === false ? "" : search.title,
					'sfw'   : search.nsfw ? 0 : 1
				};
			},
			
			tags : function(data) {
			}
		},
		
		events : {
			searchSubmit : function(event) {
				event.preventDefault();
				
				boardlist.submit( { 
					'lang'  : event.data.searchLang.val(),
					'tags'  : event.data.searchTag.val(),
					'title' : event.data.searchTitle.val(),
					'sfw'   : event.data.searchSfw.prop('checked') ? 1 : 0
				} );
				
				return false;
			},
			
			tagClick : function(event) {
				event.preventDefault();
				
				var $this  = $(this),
					$input = $( boardlist.options.selector['search-tag'] );
				
				$input
					.val( ( $input.val() + " " + $this.text() ).replace(/\s+/g, " ").trim() )
					.trigger( 'change' )
					.focus();
				
				return false;
			}
		},
		
		submit : function( parameters ) {
			var $boardlist = boardlist.$boardlist,
				$boardbody = $( boardlist.options.selector['board-body'], $boardlist ),
				$boardload = $( boardlist.options.selector['board-loading'], $boardlist );
			
			$boardbody.html("");
			$boardload.show();
			
			$.get(
				"/board-search.php",
				parameters,
				function(data) {
					$boardload.hide();
					boardlist.build.boardlist( $.parseJSON(data) );
				}
			);
		},
		
		init : function( target ) {
			if (typeof target !== "string") {
				target = boardlist.options.selector.boardlist;
			}
			
			var $boardlist = $(target);
			
			if ($boardlist.length > 0 ) {
				$( boardlist.options.selector['board-loading'], $boardlist ).hide();
				
				boardlist.$boardlist = $boardlist;
				boardlist.bind.form();
			}
		}
	};
	
	// Tie to the vichan object.
	if (typeof window.vichan === "undefined") {
		window.vichan = {};
	}
	window.vichan.boardlist = boardlist;
	
	// Initialize the boardlist when the document is ready.
	$( document ).on( 'ready', window.vichan.boardlist.init );
	// Run it now if we're already ready.
	if  (document.readyState === 'complete') {
		window.vichan.boardlist.init();
	}
} )( window, jQuery );