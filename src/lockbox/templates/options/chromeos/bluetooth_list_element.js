// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('options.system.bluetooth', function() {
  /**
   * Bluetooth settings constants.
   */
  function Constants() {}

  /**
   * Enumeration of supported device types.  Each device type has an
   * associated icon and CSS style.
   * @enum {string}
   */
  Constants.DEVICE_TYPE = {
    COMPUTER: 'computer',
    HEADSET: 'headset',
    KEYBOARD: 'input-keyboard',
    MOUSE: 'input-mouse',
    PHONE: 'phone',
  };

  /**
   * Enumeration of possible states for a bluetooth device.  The value
   * associated with each state maps to a localized string in the global
   * variable 'templateData'.
   * @enum {string}
   */
  Constants.DEVICE_STATUS = {
    CONNECTED: 'bluetoothDeviceConnected',
    CONNECTING: 'bluetoothDeviceConnecting',
    FAILED_PAIRING: 'bluetoothDeviceFailedPairing',
    NOT_PAIRED: 'bluetoothDeviceNotPaired',
    PAIRED: 'bluetoothDevicePaired'
  };

  /**
   * Enumeration of possible states during pairing.  The value associated
   * with each state maps to a loalized string in the global variable
   * 'tempateData'.
   * @enum {string}
   */
  Constants.PAIRING = {
    CONFIRM_PASSKEY: 'bluetoothConfirmPasskey',
    ENTER_PASSKEY: 'bluetoothEnterPasskey',
    FAILED_CONNECT_INSTRUCTIONS: 'bluetoothFailedPairingInstructions',
    REMOTE_PASSKEY: 'bluetoothRemotePasskey'
  };

  /**
   * Creates an element for storing a list of bluetooth devices.
   * @param {Object=} opt_propertyBag Optional properties.
   * @constructor
   * @extends {HTMLDivElement}
   */
  var BluetoothListElement = cr.ui.define('div');

  BluetoothListElement.prototype = {
    __proto__: HTMLDivElement.prototype,

    /** @inheritDoc */
    decorate: function() {
    },

    /**
     * Loads given list of bluetooth devices. This list will comprise of
     * devices that are currently connected. New devices are discovered
     * via the 'Find devices' button.
     * @param {Array} devices An array of bluetooth devices.
     */
    load: function(devices) {
      this.textContent = '';
      for (var i = 0; i < devices.length; i++) {
        if (this.isSupported_(devices[i]))
          this.appendChild(new BluetoothItem(devices[i]));
      }
    },

    /**
     * Adds a bluetooth device to the list of available devices. A check is
     * made to see if the device is already in the list, in which case the
     * existing device is updated.
     * @param {Object.<string,string>} device Description of the bluetooth
     *     device.
     */
    appendDevice: function(device) {
      if (!this.isSupported_(device))
        return;
      var item = new BluetoothItem(device);
      var existing = this.findDevice(device.address);
      if (existing) {
        this.replaceChild(item, existing);
        return;
      }
      this.appendChild(item);
    },

    /**
     * Scans the list of elements corresponding to discovered Bluetooth
     * devices for one with a matching address.
     * @param {string} address The address of the device.
     * @return {Element|undefined} Element corresponding to the device address
     *     or undefined if no corresponding element is found.
     */
    findDevice: function(address) {
      var candidate = this.firstChild;
      while (candidate) {
        if (candidate.data.address  == address)
          return candidate;
        candidate = candidate.nextSibling;
      }
    },

    /**
     * Tests if the bluetooth device is supported based on the type of device.
     * @param {Object.<string,string>} device Desription of the device.
     * @return {boolean} true if the device is supported.
     * @private
     */
    isSupported_: function(device) {
      var target = device.icon;
      for (var key in Constants.DEVICE_TYPE) {
        if (Constants.DEVICE_TYPE[key] == target)
          return true;
      }
      return false;
    }
  };

  /**
   * Creates an element in the list of bluetooth devices.
   * @param {{name: string,
   *          address: string,
   *          icon: Constants.DEVICE_TYPE,
   *          paired: boolean,
   *          connected: boolean,
   *          pairing: string|undefined,
   *          passkey: number|undefined,
   *          entered: number|undefined}} device
   *     Decription of the bluetooth device.
   * @constructor
   */
  function BluetoothItem(device) {
    var el = cr.doc.createElement('div');
    el.data = {};
    for (var key in device)
      el.data[key] = device[key];
    BluetoothItem.decorate(el);
    return el;
  }

  /**
   * Decorates an element as a bluetooth item.
   * @param {!HTMLElement} el The element to decorate.
   */
  BluetoothItem.decorate = function(el) {
    el.__proto__ = BluetoothItem.prototype;
    el.decorate();
  };

  BluetoothItem.prototype = {
    __proto__: HTMLDivElement.prototype,

    /** @inheritDoc */
    decorate: function() {
      this.className = 'bluetooth-item';
      this.connected = this.data.connected;
      // Though strictly speaking, a connected device will also be paired,
      // we are interested in tracking paired devices that are not connected.
      this.paired = this.data.paired && !this.data.connected;
      this.connecting = !!this.data.pairing;
      this.addIcon_();
      this.addLabels_();
      this.addButtons_();
    },

    /**
     * Adds an icon corresponding to the device category.
     * @private
     */
    addIcon_: function() {
      var iconElement = this.ownerDocument.createElement('div');
      iconElement.className = 'bluetooth-' + this.data.icon;
      iconElement.classList.add('bluetooth-icon');
      this.appendChild(iconElement);
    },

    /**
     * Adds an element containing the display name, status and device pairing
     * instructions.
     * @private
     */
    addLabels_: function() {
      var textDiv = this.ownerDocument.createElement('div');
      textDiv.className = 'bluetooth-item-text';
      var nameEl = this.ownerDocument.createElement('div');
      nameEl.className = 'network-name-label';
      nameEl.textContent = this.data.name;
      textDiv.appendChild(nameEl);
      this.appendChild(textDiv);
      this.setDeviceStatus_(textDiv);
      if (this.data.pairing) {
        this.addPairingInstructions_(textDiv);
      }
    },

    /**
     * Adds a label showing the status of the device.
     * @param {!Element} textDiv Target element for inserting the status label.
     * @private
     */
    setDeviceStatus_: function(textDiv) {
      var status;
      if (this.data.connected)
        status = Constants.DEVICE_STATUS.CONNECTED;
      else if (this.data.paired)
        status = Constants.DEVICE_STATUS.PAIRED;
      else if (this.data.pairing)
        status = Constants.DEVICE_STATUS.CONNECTING;
      else
        status = Constants.DEVICE_STATUS.NOT_PAIRED;
      var statusMessage = templateData[status];
      if (statusMessage) {
        var statusEl = this.ownerDocument.createElement('div');
        statusEl.className = 'network-status-label';
        statusEl.textContent = statusMessage;
        if (this.connecting) {
          var throbber = this.ownerDocument.createElement('div');
          throbber.className = 'throbber';
          statusEl.appendChild(throbber);
        }
        textDiv.appendChild(statusEl);
      }
    },

    /**
     * Adds instructions on how to complete the pairing process.
     * @param {!Element} textDiv Target element for inserting the instructions.
     * @private
     */
    addPairingInstructions_: function(textDiv) {
      var instructionsEl = this.ownerDocument.createElement('div');
      instructionsEl.className = 'bluetooth-instructions';
      var message = templateData[this.data.pairing];
      var array = this.formatInstructions_(message);
      for (var i = 0; i < array.length; i++) {
        instructionsEl.appendChild(array[i]);
      }
      if (this.data.pairing == Constants.PAIRING.ENTER_PASSKEY) {
        var input = this.ownerDocument.createElement('input');
        input.type = 'text';
        input.className = 'bluetooth-passkey-field';
        instructionsEl.appendChild(input);
      }
      textDiv.appendChild(instructionsEl);
    },

    /**
     * Formats the pairing instruction, which may contain labels for
     * substitution.  The label '%1' is replaced with the passkey, and '%2'
     * is replaced with the name of the bluetooth device.  Formatting of the
     * passkey depends on the type of validation.
     * @param {string} instructions The source instructions to format.
     * @return {Array.<Element>} Array of formatted elements.
     */
    formatInstructions_: function(instructions) {
       var array = [];
       var index = instructions.indexOf('%');
       if (index >= 0) {
         array.push(this.createTextElement_(instructions.substring(0, index)));
         var labelPlaceholder = instructions.charAt(index + 1);
         // ... handle the placeholder
         switch (labelPlaceholder) {
         case '1':
           array.push(this.createPasskeyElement_());
           break;
         case '2':
           array.push(this.createTextElement_(this.data.name));
         }
         array = array.concat(this.formatInstructions_(instructions.substring(
             index + 2)));
       } else {
         array.push(this.createTextElement_(instructions));
       }
       return array;
    },

    /**
     * Formats an element for displaying the passkey.
     * @return {Element} Element containing the passkey.
     */
    createPasskeyElement_: function() {
      var passkeyEl = document.createElement('div');
      if (this.data.pairing == Constants.PAIRING.REMOTE_PASSKEY) {
        passkeyEl.className = 'bluetooth-remote-passkey';
        var key = String(this.data.passkey);
        var progress = this.data.entered;
        for (var i = 0; i < key.length; i++) {
          var keyEl = document.createElement('div');
          keyEl.textContent = key.charAt(i);
          keyEl.className = 'bluetooth-passkey-char';
          if (i < progress)
            keyEl.classList.add('key-typed');
          passkeyEl.appendChild(keyEl);
        }
        // Add return key symbol.
        var keyEl = document.createElement('div');
        keyEl.className = 'bluetooth-passkey-char';
        keyEl.textContent = '\u23ce';
        passkeyEl.appendChild(keyEl);
      } else {
        passkeyEl.className = 'bluetooth-confirm-passkey';
        passkeyEl.textContent = this.data.passkey;
      }
      return passkeyEl;
    },

    /**
     * Adds a text element.
     * @param {string} text The text content of the new element.
     * @param {string=} opt_style Optional parameter for the CSS class for
     *     formatting the text element.
     * @return {Element} Element containing the text.
     */
    createTextElement_: function(text, array, opt_style) {
      var el = this.ownerDocument.createElement('span');
      el.textContent = text;
      if (opt_style)
        el.className = opt_style;
      return el;
    },

    /**
     * Adds buttons for updating the connectivity of a device.
     * @private.
     */
    addButtons_: function() {
      var buttonsDiv = this.ownerDocument.createElement('div');
      buttonsDiv.className = 'bluetooth-button-group';
      var buttonLabelKey = null;
      var callbackType = null;
      if (this.connected) {
        buttonLabelKey = 'bluetoothDisconnectDevice';
        callbackType = 'disconnect';
      } else if (this.paired) {
        buttonLabelKey = 'bluetoothForgetDevice';
        callbackType = 'disconnect';
      } else if (this.connecting) {
        buttonLabelKey = 'bluetoothCancel';
        callbackType = 'cancel';
      } else {
        buttonLabelKey = 'bluetoothConnectDevice';
        callbackType = 'connect';
      }
      if (buttonLabelKey && callbackType) {
        var buttonEl = this.ownerDocument.createElement('button');
        buttonEl.textContent = localStrings.getString(buttonLabelKey);
        var self = this;
        var callback = function(e) {
          chrome.send('updateBluetoothDevice',
              [self.data.address, callbackType]);
        }
        buttonEl.addEventListener('click', callback);
        buttonsDiv.appendChild(buttonEl);
      }
      if (this.data.pairing == Constants.PAIRING.CONFIRM_PASSKEY ||
          this.data.pairing == Constants.PAIRING.ENTER_PASSKEY) {
        var buttonEl = this.ownerDocument.createElement('button');
        buttonEl.textContent = localStrings.getString('bluetoothConnectDevice');
        // TODO(kevers): Add callbacks.
        buttonsDiv.insertBefore(buttonEl, buttonsDiv.firstChild);
      }
      this.appendChild(buttonsDiv);
    }
  };

  cr.defineProperty(BluetoothItem, 'connected', cr.PropertyKind.BOOL_ATTR);

  cr.defineProperty(BluetoothItem, 'paired', cr.PropertyKind.BOOL_ATTR);

  cr.defineProperty(BluetoothItem, 'connecting', cr.PropertyKind.BOOL_ATTR);

  return {
    Constants: Constants,
    BluetoothListElement: BluetoothListElement
  };
});
