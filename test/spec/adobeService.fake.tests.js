describe('codemill.adobe.cmAdobeService', function () {

  var service, exceptionHandler, scope, open;

  beforeEach(module('codemill.adobe'));

  beforeEach(module(function ($provide) {
    open = jasmine.createSpy('open');
    $provide.value('$window', {
      open: open
    });
    CSInterface = function() {}
  }));

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
    expect(service.isHostAvailable()).toBe(false);
  });

  // openURLInDefaultBrowser
  it('openURLInDefaultBrowser tries to launch url in $window', function () {
    service.openURLInDefaultBrowser('http://test.com');
    expect(open).toHaveBeenCalledWith('http://test.com');
  });

  // callCS
  it('callCS should resolve immediately', function() {
    var success = jasmine.createSpy('success');
    service.callCS({}).then(success);
    scope.$apply();
    expect(success).toHaveBeenCalled();
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
  });

  it('getFilePath with no pathType should return documents file path', function() {
    expect(service.getFilePath({ filePath : 'test' })).toBe('/tmp/documents/test/');
  });

  it('getFilePath with documents pathType should return documents file path', function() {
    expect(service.getFilePath({ pathType : 'documents', filePath : 'test' })).toBe('/tmp/documents/test/');
  });

  it('getFilePath with other pathType should return other file path', function() {
    expect(service.getFilePath({ pathType : 'other', filePath : 'test' })).toBe('/tmp/other/test/');
  });

  it('getFilePath with isFile set should not add / at the end', function() {
    expect(service.getFilePath({ pathType : 'other', filePath : 'test', isFile : true })).toBe('/tmp/other/test');
  });

});
