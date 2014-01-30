/*global jQuery:false*/

(function($){
	'use strict';

	$.fn.gallerify = function(specifiedSettings){
		return this.each(function(){
			var settings = $.extend({
				fitWidth: false,
				duration: 400, // slide animation duration
				fadeOutTo: 1,
				sizeOutTo: 1,
				cycle: false,
				hideMarkers: false,
				preSlide: function(){},
				postSlide: function(){},
				slidePause: 0
			},specifiedSettings,true);

			var container = $(this);
			var list = container.children('ul');
			var slides = list.children();
			var slideIndexes = [];
			var initialSlide = slides.filter('.current').length ? slides.filter('.current') : slides.first();
			var width = slides.eq(0).width();
			var currentScroll = slides.index(initialSlide)*width;
			var markers;
			var marker;
			var visibleSlides;
			var setSize; // holder for window resizing function
			var animating = false; // timer for animation completion
			
			var setFadeOut = function(animate,slide){
				var fadeDuration = animate ? settings.duration : 0;
				if (settings.fadeOutTo<1 && slide.length){
					slide.animate({
						opacity: 1
					},fadeDuration).siblings().animate({
						opacity: settings.fadeOutTo
					},fadeDuration);
				}
			};
			var setSizeOut = function(animate,slide){
				if (settings.sizeOutTo<1 && slide.length){
					var spread = Math.floor(visibleSlides/2);
					var currentIndex = slides.index(slide);
					slides.children('.resizer').each(function(i){
						var scale = ((currentIndex-spread)<=i && i<=(currentIndex+spread)) ? (spread-Math.abs(currentIndex-i))*((1/spread)*0.5)+0.5 : 0.5;
						$(this).animate({
							transform: 'scale('+scale+')',
						},settings.duration).css({
							'-webkit-filter': 'blur('+((1/scale)-1)*2.5+'px)',
							'filter': 'blur('+((1/scale)-1)*2.5+'px)'
						});
					});
				}
			};

			var slide = function(e){
				e.preventDefault();
				var currentSlide = slides.eq(Math.round(container.scrollLeft()/width)),
					slidesRequired,
					slidesPresent,
					nextSlide,
					newScroll;
				
				var finishSlide = function(){
					if (!settings.hideMarkers) { // update markers
						markers.children().removeClass('current').eq(nextSlide.data('index')).addClass('current');
					}
					currentScroll = container.scrollLeft();
				};
				
				if (!animating) { // only animate if we’re not animating
					
					animating = true; // mark as animation in progress

					if (settings.cycle) {
						if (e.data.direction !== undefined) {
							if (e.data.direction=='prev') {
								slidesRequired = ((visibleSlides-1)/2)+1;
								slidesPresent = currentSlide.prevAll().length;
								if (slidesPresent<slidesRequired) {
									slides.last().insertBefore(slides.first());
									container.scrollLeft(container.scrollLeft()+width);
								}
							} else if (e.data.direction=='next') {
								slidesRequired = ((visibleSlides-1)/2)+1;
								slidesPresent = currentSlide.nextAll().length;
								if (slidesPresent<slidesRequired) {
									slides.first().insertAfter(slides.last());
									container.scrollLeft(container.scrollLeft()-width);
								}
							}
						} else if (e.data.i !== undefined) {
							$.each(slideIndexes,function(i,e){
								list.append(e);
							});
							container.scrollLeft(currentSlide.data('index')*width);
						}
						slides = list.children();
					}

					if (e.data.direction !== undefined) { // prev/next button pushed
						nextSlide = e.data.direction=='prev' ? currentSlide.prev() : currentSlide.next();
						newScroll = ((e.data.direction=='prev') ? '-=' : '+=' )+width;
					} else if (e.data.i !== undefined) { // marker clicked
						nextSlide = slideIndexes[e.data.i];
						newScroll = (e.data.i)*width;
					}

					if (currentSlide.length !== 0 && nextSlide.length !== 0) { // make sure we’ve got the slides we need i.e. not at beginning or end
						settings.preSlide(currentSlide,nextSlide);
						setTimeout(function(){
							container.animate({
								scrollLeft: newScroll
							},{
								duration: settings.duration,
								complete: finishSlide
							});
							setFadeOut(true,nextSlide);
							setSizeOut(true,nextSlide);
							setTimeout(function(){
								settings.postSlide(currentSlide,nextSlide);
								setTimeout(function(){
									animating = false;
								},settings.slidePause);
							},settings.duration);
						},settings.slidePause);
					} else {
						animating = false;
					}
				}
			};

			// fit slides to window on init and resize
			setSize = function(){
				if (settings.fitWidth) {
					var index = currentScroll/width;
					width = container.width();
					slides.width(width);
					list.width(width*slides.length);
					currentScroll = index*width;
					container.scrollLeft(currentScroll);
				} else {
					var padding = (container.width()-width)/2 + 'px';
					list.css({
						paddingLeft: padding,
						paddingRight: padding
					});
					list.width(width*slides.length);
				}
				visibleSlides = Math.ceil(container.width()/width);
				if (visibleSlides%2 === 0) visibleSlides++; // range of slides visible to the user (forced to an odd number)
			};

			$(window).resize(setSize);
			setSize();

			if (slides.length>1) {
				
				slides.each(function(){
					var slide = $(this);
					slide.data('index',slides.index(this));
					slideIndexes.push(slide);
				});
				
				// add the markers
				if (!settings.hideMarkers) {
					markers = $('<ol class="markers" />').insertAfter(container);
					for (var i=0;i<slides.length;i++) {
						marker = $('<li><a href="#">Page '+(i+1)+'</a></li>');
						marker.appendTo(markers);
						marker.children().on('click',{i:i},slide);
						if (i==initialSlide.data('index')) marker.addClass('current');
					}
					markers.css({marginLeft: 0 - markers.outerWidth(true)/2 });
				}

				// add prev/next buttons
				$('<button class="next">Next</button>').on('click',{direction:'next'},slide).insertAfter(container);
				$('<button class="prev">Previous</button>').on('click',{direction:'prev'},slide).insertAfter(container);

				// initial fades and sizes
				setFadeOut(false,initialSlide);
				setSizeOut(false,initialSlide);
				
				// add handler for iOS rotation breaking scroll position
				document.addEventListener('onorientationchange',function(){ container.scrollLeft(currentScroll); },false);
			}

			// initial scroll position
			container.scrollLeft(currentScroll);
			
		});
	};

})(jQuery);