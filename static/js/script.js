define(['text', 'jquery', 'htmlEntites', 'buttonHandler', 'slide-template', 'settings', 'canvas'], function(textStyle, $, htmlEntites, bHandler, slideTemplate, settings, canvas){

	var Kreator = (function (options) {
		var slideX = 0, // to keep track of the current slide we're on
			slideY = 0, // to keep track of the current slide we're on
			$ = options.jquery,
			Reveal = options.reveal,
			$span,
			hljs = options.hljs;

		var init = function() {

			options.right = $('<div data-direction="right">+</div>')
					.addClass('add-slide add-right')
					.on('click', function(){
						Kreator.addSlideRight();
						Reveal.navigateRight();
					});
			
			options.down = $('<div data-direction="bottom">+</div>')
					.addClass('add-slide add-down')
					.on('click', function(){
						Kreator.addSlideDown();
						Reveal.navigateDown();
					});
			
			settings.clear();

			$('body').append(options.right).append(options.down);

			$('section').on('click', addContentToSlide);

			$('#download').on('click', function(){
				var s = $('.slides>section');
				var slides = {};
				
				s.each(function(idx, slide){
					slide = $(slide);
					if($('section', slide).length) {
						slides['slide'+idx] = [];
						$('section', slide).each(function(i, sl){
							sl = $(sl);
							content = sl.html();
							content = htmlEntites.convertTags(content);
							slides['slide'+idx].push(content);
						});
					} else {
						content = slide.html();
						content = htmlEntites.convertTags(content);
						slides['slide'+idx] = '<section>' + content + '</section>';
					}
				});
		
				var html = document.querySelector('html'),
					theme;
				if(html.classList.length) {
					theme = html.classList[0];
					if(theme.length>12) {
						theme = 'head';
					}
				} else {
					theme = 'head';
				}

				var webfonts = '';
				var fonts = settings.get('webfont');
				if(Array.isArray(fonts)) webfonts = fonts.map(function (font) {
					return "<link href='http://fonts.googleapis.com/css?family="+font+"' rel='stylesheet' type='text/css'>"
				}).join('');
					else webfonts = "<link href='http://fonts.googleapis.com/css?family="+fonts+"' rel='stylesheet' type='text/css'>";

				var title = settings.get('title') || 'kreator.js presentation';
				var description = settings.get('description') || 'kreator.js presentation';
				var author = settings.get('author') || 'kreator.js presentation';
				
				$.ajax({
					  type: 'POST'
					, url : '.'
					, dataType : 'jsonpi'
					, params : {
						slides : slides,
						params: settings.get(),
						theme: theme,
						webfont: webfonts,
						title: title,
						description: description,
						author: author
					}
				});
			});

			$('#settings-btn').on('click', function(){
				slideTemplate.showSettings.call($('.reveal'));
			});

			$('.btn-group a').on('click', function(e){
				e.preventDefault();
				var tag = $(this).data('textstyle');
				$(this).toggleClass('active');
				if(tag === 'li') {
					if($(this).hasClass('active'))
						$span = $('<span contentEditable><li></li></span>')
							.on('click', editSpan)
							.appendTo(Kreator.getCurrentSlide())
							.trigger('click').focus();
				}
				if(['b', 'i'].indexOf(tag)>=0) {
					$(this).toggleClass('active');
					$span.html(textStyle.format(tag, $span));
				} else if(['blockquote'].indexOf(tag)>=0) {
					$(this).toggleClass('active');
					textStyle.paragraph(tag, $span);
				} else if(['left', 'center', 'right'].indexOf(tag)>=0) {
					$(this).toggleClass('active');
					textStyle.align(tag, $span);
				} else if(tag === 'a') {
					$(this).toggleClass('active');
					textStyle.insertHiperlink(this, $span);
				} else if(tag === 'move') {
					$(this).toggleClass('btn-info');
					var section = $('.reveal section');
					if(!$(this).hasClass('active') && $('span', $('.present')).length ) {
						$('.present span').off('mousedown', bHandler.moveSpan)
								.attr('contentEditable', true);
						var className = $span.attr('class') || $span.addClass(Kreator.generateClassName(1)) && $span.attr('class');
						settings.set(['.'+className, 'position:absolute;top:'+$span.css('top')+';left:'+$span.css('left')]);
						
					} else {
						$('.present span').on('mousedown', bHandler.moveSpan)
								.attr('contentEditable', false);
					}
					$('.present').toggleClass('crosshair');
				} else if(tag === 'grid') {
		
					if($(this).hasClass('active')) {
						canvas.init();
					} else {
						canvas.remove();
					}
				} else if(tag === 'remove') {
					
					$(this).toggleClass('btn-info');
					$('.present').toggleClass('crosshair');
					
					if($(this).hasClass('active')) {
						$('span').on('click', bHandler.removeSpan);
					} else {
						$('span').off('click', bHandler.removeSpan);
					}
				} else if(tag === 'grid-clear') {
					$(this).toggleClass('active');
					settings.remove(['canvasPoints']);
				} else if(tag === 'upload') {
					slideTemplate.uploadImages.call($(this));
				} else if(tag === 'images') {
					$('.thumbnails').toggle();
				} else if(tag === 'resize') {
					$('.present').toggleClass('resize');
					var img = document.querySelector('.present img');
					if (img) bHandler.imageResize(img);
					if ( ! $(this).hasClass('active') ) {
						var x = Reveal.getIndices().h + 1;
						var y = Reveal.getIndices().v + 1;
						if (y==1) {
							settings.set(['.slides:nth-child('+x+') section img', 'width :' + img.style.width]);
						} else {
							settings.set(['.slides section:nth-child('+x+') section:nth-child('+y+') img', 'width :' + img.style.width]);
						}
					}
				} else if (tag === 'textcolor') {
					var that = $(this);
					if($('input[type=color]').length) {
						$('input[type=color]').remove();
					}
					if (that.hasClass('active')) {
						var input = $('<input type="color">');
						that.append(input);
						input.on('click', function(e){
							e.stopPropagation();
						}).on('change', function(){
							var color = $(this).val();
							$span.html(textStyle.format('span', $span));
							var coloredText = $('span:not([style])', $span);
							var className = coloredText.attr('class') || Kreator.generateClassName(1);
							console.log(className);
							coloredText.css('color', color).addClass(className);
							settings.set(['.' + className, 'color:' + color]);
							$(this).remove();
							that.trigger('click');
						});
					}
				} else if (tag === 'fullscreen' || tag === 'settings') {
					$(this).removeClass('active');
				} else if (tag === 'bgcolor') {
					var that = $(this);
					if($('input[type=color]').length) {
						$('input[type=color]').remove();
					}
					var input = $('<input type="color">');
						that.append(input);
						input.on('click', function(e){
							e.stopPropagation();
						}).on('change', function(){
							var color = $(this).val();
							var className = $span.attr('class') || Kreator.generateClassName(1);
							console.log(className);
							$span.css('background', color);
							if (!$span.attr('class')) {
								$span.addClass(className);
							}
							settings.set(['.' + className, 'background:' + color]);
							$(this).remove();
							that.trigger('click');
						});

				} else if (tag === 'overview') {
					Reveal.toggleOverview();
				}
			});

			$('.thumbnails img').live('click', function () {
				var el = $('<img>').attr('src', $(this).attr('src'))
					.css('width', '200px')
					.attr('data-path', $(this).attr('data-path'));
				var s = $('<span/>').append(el).appendTo('.present');
				s.on('click', function (e) {
					editSpan(e, this);
				});
			});

			$('#duplicate').on('click', function () {

				var slide = Kreator.getCurrentSlide();

				if($(this).hasClass('btn-group')) {
					var el = document.querySelector('.duplicate-direction');
					if($('.duplicate-direction').hasClass('right')) {
						Kreator.addSlideRight(slide);
						Reveal.navigateRight();
					} else {
						Kreator.addSlideDown(slide);
						Reveal.navigateDown();
					}
					return;
				}
				$this = $(this);
				var btn = $('<button/>').addClass('btn');
				$this.addClass('btn-group').removeClass('btn btn-warning');
				btn.clone().html('<i class="icon-arrow-down"></i>')
							.hover(function(e){
								$(this).addClass('duplicate-direction down');
							}, function(e) {
								$(this).removeClass('duplicate-direction down');
								var that = this;
								bHandler.cancelDuplicate(e, that);
							})
							.appendTo($this);
				btn.clone().html('<i class="icon-arrow-right"></i>')
							.hover(function(e){
								$(this).addClass('duplicate-direction right');
							}, function(e) {
								var that = this;
								$(this).removeClass('duplicate-direction right');
								bHandler.cancelDuplicate(e, that);
							})
							.appendTo($this);
				
			});

			$('#remove-slide').on('click', function () {
				var coords = Reveal.getIndices();
				if(coords.h || coords.v) {
					if (coords.v) {
						var s = Kreator.getCurrentSlide();
						s.remove();
						Reveal.navigateTo(coords.h, coords.v-1);
					} else {
						var s = Kreator.getCurrentSlide();
						s.remove();
						Reveal.navigateTo(coords.h-1, coords.v);
					}
				}
				// var coords = Reveal.getIndices();
				// console.log(coords);
				// //$('.present').remove();
				// if(coords.v) {
				// 	Reveal.navigateTo( coords.h, coords.v-1 );
				// } else {
				// 	Reveal.navigateTo( coords.h-1, coords.v );
				// }
				//Reveal.navigatePrev();
				//Reveal.toggleOverview();
			});

			$('#select-dimensions').on('change', function () {
				// create H headings
				var h = $(this).val();
				var html = textStyle.removeHeadings($span.html());
				$span.html('<' + h + '>' + html + '</' + h + '>');
			});

			$('#cl-dimensions').on('change', function(){
				var tag = $(this).val(),
				string = textStyle.paragraph(tag, $span);
				if(string) $span.html(string);
			});

			$('.fullscreen').on('click', function(){
				bHandler.toggleFullscreen();
				Reveal.navigateTo(0,0);
			});

			$(window).on('paste', function(e){
				setTimeout(function(){textStyle.formatCode.call(Kreator, $span);}, 100);
			});

			$('.menu li').on('click', function () {
				var $this = $(this);
				var action = $this.attr('data-title');
				$this.toggleClass('active');
				if(action === 'rotate') {
					$('.menu .active').removeClass('active');
					$this.addClass('active');
					
					$span.css('transform','rotate(10deg)');
					$('#menu-input').val('10deg');
					if(!document.querySelector('#range-handler')) {
						var fragment = document.createDocumentFragment()
						, li = document.createElement('li')
						, range = document.createElement('input');
						range.type="range";
						range.id ="range-handler";
						range.min=-180;
						range.max=180;
						range.addEventListener('change', function(){
							$('#menu-input').val(this.value + ' deg').trigger('keyup');
						}, false);
						li.appendChild(range);
						fragment.appendChild(li);
						document.querySelector('.menu').appendChild(fragment);
					} else {
						$('#range-handler').show();
					}

				} else if(action === 'add class') {
					$('.menu .active').removeClass('active');
					$('#range-handler').hide();
					$(this).addClass('active');
					var clsName = $span.attr('class');
					$('#menu-input').attr('placeholder', 'class name').val(clsName);
				} else if(action === 'clear') {
					var clsName = $span.attr('class');
					settings.remove(clsName);
					$span.removeClass();
					$span.css({
						'transform': 'none',
						'font-family': 'inherit'
					});
				} else if(action === 'font') {
					$('#range-handler').hide();
					$('#menu-input').attr('placeholder', 'font family').val($span.css('font-family'));
					$span.addClass(Kreator.generateClassName(1));
					$('.menu .active').removeClass('active');
					$(this).addClass('active');
				}

			});

			$('#menu-input').on('keyup', function (e) {
				var value = parseInt($(this).val()) || 0;
				var action = $('.menu .active').attr('data-title');
				var clsName = $span.attr('class') || $span.addClass(Kreator.generateClassName(1)) && $span.attr('class');
				
				if(action === 'rotate') {
					$span.css('transform','rotate('+value+'deg)');
					if(clsName) {
						settings.set(['.'+clsName, '-webkit-transform: rotate('+value+'deg);-moz-transform: rotate('+value+'deg);transform: rotate('+value+'deg)']);
					}
				} else if (action === 'add class') {
					if(e.keyCode == 13) {
						var oldCls = $span.attr('class');
						var newCls = $(this).val();
						$span.removeClass().addClass(newCls);
						$('#menu-input').val('');
						settings.copy('.'+oldCls, '.'+newCls);
					}
				} else if (action === 'font') {
					
					if(e.keyCode == 13) {
						
						var family = $(this).val();
						WebFont.load({
							google: {
								families: [ family ]
							},
							active: function () {
								$span.css('font-family', family);
								if($('h1', $span).length) {
									$('h1', $span).css('font-family', family);
								}
								if(clsName) {
									settings.set(['.'+clsName, 'font-family: ' + family]);
								}
								settings.set(family, 'webfont');
							}
						});
					}
				}
			});

		};

		var generateClassName = function (testClass) {
			var n = 1;
			while ($('.kreator-class-' + n).length)
				n++;
			return 'kreator-class-' + n;
		};

		var addContentToSlide = function() {
			
			var present = Kreator.getCurrentSlide();

			var count = $('span', $(present)).length;
			if ($('.present').hasClass('crosshair') || count > 10) return;

			var d = $('<span contentEditable></span>').on('click', function(e){
				editSpan(e, d);
			});

			d.appendTo($(present)).trigger('click').focus();

			var list = ($('.btn.active').attr('data-textstyle') === 'li');
			if(list) {
				$('.active').trigger('click');
			}
			if(!count) {
				$('.menu.hidden').removeClass('hidden');
			}
		};
		
		var getLastSpan = function() {
			var s = Kreator.getCurrentSlide();
			var spans = $('span', s);
			return spans.eq(spans.length-1);
		};

		var getCurrentSlide = function() {
			var present;
			var slides = document.querySelectorAll('.present');
			[].forEach.call(slides, function(s){
				if(!s.classList.contains('stack')) {
					present = s;
				}
			});
			return $(present);
		};

		var addSlideRight = function(slide) {
			var s = Kreator.getCurrentSlide();
			$('.active').trigger('click');
			// if the current slide is the last slide on the X axis we append to the parent
			if($('.slides>section').length == Reveal.getIndices().h+1) {
				if(slide) {
					$('<section/>')
						.on('click', addContentToSlide)
						.html(slide.html())
						.appendTo('.slides');
				}
				else
					$('<section/>').on('click', addContentToSlide).appendTo('.slides');
			} else { // else we just append after the current element
				if(slide)
					slide.on('click', addContentToSlide).insertAfter(s);
				else
					$('<section/>').on('click', addContentToSlide).insertAfter(s);
			}
			$('.menu').addClass('hidden');
		};

		var addSlideDown = function(slide) {
			var ind = Reveal.getIndices();
			var newSlide = slide || $('<section/>');
			newSlide.on('click', addContentToSlide);
			if(ind.v) {
				var parent = document.querySelector('.stack.present');
				$('<section></section>').html(newSlide.html())
										.on('click', addContentToSlide)
										.appendTo($(parent));
			} else {
				var content = $('.present').html();
				var holder = $('<section></section>');
				$('.present').replaceWith(holder);
				$('<section/>').html(content).appendTo(holder);
				newSlide.appendTo(holder);

			}
			Reveal.navigateDown();
			$('.menu').addClass('hidden');
		};

		var editSpan = function(e, that) {
			
			e.stopPropagation();
			$span = $(that) || $(this);
			var textStyle = htmlEntites.findTags($span.html());
			
			if(textStyle >= 0)
				$('#select-dimensions option:eq('+textStyle+')').attr('selected', 'selected');

			$('.menu').css({
				'top' : e.currentTarget.offsetTop + 27,
				'display' : 'block'
			});
			
		};

		return {
			addSlideDown: addSlideDown,
			addSlideRight: addSlideRight,
			editSpan: editSpan,
			getCurrentSlide: getCurrentSlide,
			generateClassName: generateClassName,
			init: init
		};
	})({
		jquery: $,
		reveal: Reveal,
		hljs: hljs,
		settings: settings
	});

	return Kreator;
});