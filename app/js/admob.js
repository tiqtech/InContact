// AdMob Publisher Code
// Language: webOS SDK
// Version: 20091118
// Copyright AdMob, Inc., All rights reserved
// http://code.google.com/p/admob-webos/
/**
 * Copyright (c) 2009 AdMob, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

if (typeof AdMob == 'undefined') {
	var AdMob = {};
}

AdMob.ad = function() {
	var admob_url = 'http://r.admob.com/ad_source.php';
	var pub_id;
	var udid = null;
	var bg_color;
	var text_color;
	var tiles = ['chat', 'affilateoffers', 'contests', 'generic', 'healthfitness', 'toolsutilities', 'portal2'];
	var armor = 'clear:none;outline:none;margin:0;border:none;'; // mild css armor for main div 
	
	var cpc_template = new Template([
		'<div style="float: left"><img src="http://mm.admob.com/static/pre/img/#{tile}.png"></div>',
		'<div style="float: left; padding: 3px 5px; height: 30px; width: 230px; color: \##{text_color}; overflow: hidden">',
			'<div style="line-height: 17px; font: bold 12px helvetica;">#{text}</div>',
			'<div style="padding-top: 5px; width: 100%; text-align: right;line-height: 13px; font: normal 9.5px helvetica;">Ads by AdMob</div>',
		'</div>',
		'<div style="float: left; padding: 5px 0"><img class="_AdMobAction" src="http://mm.admob.com/static/pre/img/action_web.png"></div>',
		'<div style="clear: both"></div>'
	].join(''));
	var cpm_template = new Template([
		'<div style="padding: 0; margin: 0; background: url(#{banner}); width: 320px; height: 48px;">&nbsp;',
			'<img style="display:none" src="#{tracking_pixel}"><img style="display: none" src="#{cpm_url}">',
		'<div style="clear: both"></div></div>'
	].join(''));
	var test_mode;
	
	return {
		initialize: function(options) {
			pub_id = options.pub_id;
			if(pub_id == null) {
				Mojo.Log.info('AdMob Publisher ID required.');
				return;
			}
			
			test_mode = options.test_mode;
			bg_color = options.bg_color || '#fff';
			text_color = options.text_color || '#000';
			if(udid === null) {
				new Mojo.Service.Request('palm://com.palm.preferences/systemProperties', {
					method: "Get",
					parameters: {
						"key": "com.palm.properties.nduid"
					},
					onSuccess: (function(response){
						udid = response['com.palm.properties.nduid'];
					}).bind(this)
				});
			}
		},
		request: function(options) {
			Mojo.Log.info('AdMob Ad Request Pub Id: ', pub_id);
			var params = {
				s: pub_id,
				u: navigator.userAgent, // user agent
				ex: 1, // use client's ip address for i field
				o: udid, // uuid
				v: '20091118-WEBOSSDK-3cd2b53620088ef8',
				f: 'jsonp'
			}
			if(test_mode) params.m = 'test';

			var request = new Ajax.Request(admob_url, {
				parameters: params,
				onSuccess: function(response) {
					var ad = response.responseText.evalJSON();
					if (ad.text) {
						Mojo.Log.info('AdMob Ad Request WIN!');
						var div = new Element('div', {
							className: '_AdMobAd',
							style: armor + 'width: 312px; height: 40px; padding: 4px; background-color: ' + bg_color
						});
						div.writeAttribute('rel', ad.url);
						div.observe('click', (function(e) {
							var sr = new Mojo.Service.Request('palm://com.palm.applicationManager', {
								method: 'open',
								parameters: {
									id: 'com.palm.app.browser',
									params: {
										target: e.findElement('div._AdMobAd').getAttribute('rel')
									}
								}
							});
						}).bind(this));
						
						var ad_markup = null;
						if (!ad[20] && ad.banner) { // banner ad
							ad_markup = cpm_template.evaluate(ad);
						} else { // cpc ad
							ad_markup = cpc_template.evaluate({
								bg_color: bg_color,
								text_color: text_color,
								text: ad.text,
								url: ad.url,
								tile: tiles[Math.floor(Math.random() * tiles.length)]
							});
						}
						div.update(ad_markup);
						options.onSuccess(div);
					} else {
						Mojo.Log.info('AdMob Ad Request FAIL - no ad received!');
						options.onFailure();
					}
				},
				onFailure: function(response) {
					Mojo.Log.info('AdMob Ad Request FAIL - no response from server!');
					if(options.onFailure) options.onFailure();
				}
			});
		}
	};
}();
