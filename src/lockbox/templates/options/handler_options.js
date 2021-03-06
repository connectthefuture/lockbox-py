// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('options', function() {
  const OptionsPage = options.OptionsPage;

  /////////////////////////////////////////////////////////////////////////////
  // HandlerOptions class:

  /**
   * Encapsulated handling of handler options page.
   * @constructor
   */
  function HandlerOptions() {
    this.activeNavTab = null;
    OptionsPage.call(this,
                     'handlers',
                     templateData.handlersPageTabTitle,
                     'handler-options');
  }

  cr.addSingletonGetter(HandlerOptions);

  HandlerOptions.prototype = {
    __proto__: OptionsPage.prototype,

    /**
     * The handlers list.
     * @type {DeletableItemList}
     * @private
     */
    handlersList_: null,

    /** @inheritDoc */
    initializePage: function() {
      OptionsPage.prototype.initializePage.call(this);

      this.createHandlersList_();
    },

    /**
     * Creates, decorates and initializes the handlers list.
     * @private
     */
    createHandlersList_: function() {
      this.handlersList_ = $('handlers-list');
      options.HandlersList.decorate(this.handlersList_);
      this.handlersList_.autoExpands = true;

      this.ignoredHandlersList_ = $('ignored-handlers-list');
      options.IgnoredHandlersList.decorate(this.ignoredHandlersList_);
      this.ignoredHandlersList_.autoExpands = true;
    },
  };

  /**
   * Sets the list of handlers shown by the view.
   * @param handlers to be shown in the view.
   */
  HandlerOptions.setHandlers = function(handlers) {
    $('handlers-list').setHandlers(handlers);
  };

  /**
   * Sets the list of ignored handlers shown by the view.
   * @param handlers to be shown in the view.
   */
  HandlerOptions.setIgnoredHandlers = function(handlers) {
    $('ignored-handlers-section').hidden = handlers.length == 0;
    $('ignored-handlers-list').setHandlers(handlers);
  };

  return {
    HandlerOptions: HandlerOptions
  };
});
