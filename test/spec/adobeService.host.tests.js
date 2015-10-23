describe('codemill.adobe.cmAdobeService', function () {

  var service, exceptionHandler, scope;
  var openURLInDefaultBrowser = jasmine.createSpy('openURLInDefaultBrowser');
  var eventCallback = null, evalCallback = null;
  var evalScriptStr = null;

  beforeEach(module('codemill.adobe'));

  beforeEach(module(function () {
    eventCallback = null;
    evalCallback = null;
    evalScriptStr = null;
    CSInterface = function () {
      this.openURLInDefaultBrowser = openURLInDefaultBrowser;

      this.getOSInformation = function () {
        return "Mac";
      };

      this.getSystemPath = function (type) {
        return "/tmp/" + type;
      };

      this.addEventListener = function (type, callback) {
        eventCallback = callback;
      };

      this.evalScript = function (script, callback) {
        evalScriptStr = script;
        evalCallback = callback;
      };

    };

    SystemPath = {
      MY_DOCUMENTS: 'MY_DOCUMENTS',
      EXTENSION: 'EXTENSION',
      USER_DATA: 'USER_DATA'
    };

    cep = {
      fs: {
        makedir: jasmine.createSpy('makedir'),
        showOpenDialog : jasmine.createSpy('showOpenDialog')
      }
    };

  }));

  var result = function (data, isObject) {
    var call = evalCallback;
    if (call !== null) {
      evalCallback = null;
      call(isObject ? JSON.stringify(data) : data);
    }
  };

  var event = function (data) {
    if (eventCallback !== null) {
      eventCallback({data: data});
    }
  };

  beforeEach(module(function ($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function (_cmAdobeService_, $exceptionHandler, _$rootScope_) {
    service = _cmAdobeService_;
    exceptionHandler = $exceptionHandler;
    scope = _$rootScope_;
  }));


  it('should be initialized', function () {
    expect(!!service).toBe(true);
    expect(service.isHostAvailable()).toBe(true);
  });

  // openURLInDefaultBrowser
  it('openURLInDefaultBrowser tries to launch url in $window', function () {
    service.openURLInDefaultBrowser('http://test.com');
    expect(openURLInDefaultBrowser).toHaveBeenCalledWith('http://test.com');
  });

  // openDirectoryDialog
  it('openDirectoryDialog should call showOpenDialog', function() {
    cep.fs.showOpenDialog.and.callFake(function() { return { data : [], err : 1}});
    var result = service.openDirectoryDialog('Test', '/path');
    expect(cep.fs.showOpenDialog).toHaveBeenCalledWith(false, true, 'Test', '/path');
    expect(result.data.length).toBe(0);
    expect(result.err).toBe(1);
  });

  // registerEventListener
  it ('registerEventListener should register callback with CSInterface', function() {
    var data = 123;
    var callback = function(event) {
      expect(event.data).toBe(data);
    };
    service.registerEventListener('eventId', callback);
    expect(eventCallback).toBe(callback);
    event(data);
  });

  // callCS
  it('callCS should call CSInterface with correct code and return correct data', function() {
    var data = 123;
    var success = jasmine.createSpy('success');
    service.callCS({ method : 'test' }).then(success);
    expect(evalScriptStr).toBe('test()');
    result(data);
    scope.$apply();
    expect(success).toHaveBeenCalledWith(data);
  });

  it('callCS should not call with args if args is empty', function() {
    var data = 123;
    var success = jasmine.createSpy('success');
    service.callCS({ method : 'test', args : [] }).then(success);
    expect(evalScriptStr).toBe('test()');
    result(data);
    scope.$apply();
    expect(success).toHaveBeenCalledWith(data);
  });

  it('callCS should call with args if args is not empty', function() {
    var data = 123;
    var success = jasmine.createSpy('success');
    service.callCS({ method : 'test', args : [ 'tmp' ] }).then(success);
    expect(evalScriptStr).toBe('test(\'tmp\')');
    result(data);
    scope.$apply();
    expect(success).toHaveBeenCalledWith(data);
  });

  it('callCS should call with stringified args if args contains an object', function() {
    var data = 123;
    var arg = { tmp : 1};
    var success = jasmine.createSpy('success');
    service.callCS({ method : 'test', args : [ arg, 'tmp' ] }).then(success);
    expect(evalScriptStr).toBe('test(\'' + JSON.stringify(arg) + '\', \'tmp\')');
    result(data);
    scope.$apply();
    expect(success).toHaveBeenCalledWith(data);
  });

  it('callCS should parse return values if requested', function() {
    var data = { test : 42 };
    var arg = { tmp : 1 };
    var success = jasmine.createSpy('success');
    service.callCS({ method : 'test', args : [ arg, 'tmp' ], returnsObject : true }).then(success);
    expect(evalScriptStr).toBe('test(\'' + JSON.stringify(arg) + '\', \'tmp\')');
    result(data, true);
    scope.$apply();
    expect(success).toHaveBeenCalledWith(data);
  });

  // getFilePath
  it('getFilePath for null object should return null', function() {
    expect(service.getFilePath(null)).toBeNull();
  });

  it('getFilePath for undefined object should return undefined', function() {
    expect(service.getFilePath(undefined)).not.toBeDefined();
  });

  it('getFilePath with null pathType should return null', function() {
    expect(service.getFilePath({ pathType : 'null' })).toBeNull();
  });

  it('getFilePath with full pathType should return filePath', function() {
    expect(service.getFilePath({ pathType : 'full', filePath : 'test' })).toBe('test');
    expect(cep.fs.makedir).toHaveBeenCalledWith('test');
  });

  it('getFilePath with no pathType should return documents file path', function() {
    expect(service.getFilePath({ filePath : 'test' })).toBe('/tmp/MY_DOCUMENTS/test/');
    expect(cep.fs.makedir).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/test');
  });

  it('getFilePath with documents pathType should return documents file path', function() {
    expect(service.getFilePath({ pathType : 'documents', filePath : 'test' })).toBe('/tmp/MY_DOCUMENTS/test/');
    expect(cep.fs.makedir).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/test');
  });

  it('getFilePath with extension pathType should return extension file path', function() {
    expect(service.getFilePath({ pathType : 'extension', filePath : 'test' })).toBe('/tmp/EXTENSION/test/');
    expect(cep.fs.makedir).toHaveBeenCalledWith('/tmp/EXTENSION/test');
  });

  it('getFilePath with userdata pathType should return userdata file path', function() {
    expect(service.getFilePath({ pathType : 'userdata', filePath : 'test' })).toBe('/tmp/USER_DATA/test/');
    expect(cep.fs.makedir).toHaveBeenCalledWith('/tmp/USER_DATA/test');
  });

  it('getFilePath with other pathType should return documents file path', function() {
    expect(service.getFilePath({ pathType : 'other', filePath : 'test' })).toBe('/tmp/MY_DOCUMENTS/test/');
    expect(cep.fs.makedir).toHaveBeenCalledWith('/tmp/MY_DOCUMENTS/test');
  });

  it('getFilePath with isFile set should not add / at the end', function() {
    expect(service.getFilePath({ pathType : 'other', filePath : 'test', isFile : true })).toBe('/tmp/MY_DOCUMENTS/test');
    expect(cep.fs.makedir).not.toHaveBeenCalled();
  });
});
