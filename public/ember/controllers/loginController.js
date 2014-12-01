App.LoginController = Ember.Controller.extend(SimpleAuth.LoginControllerMixin, {
  authenticator: "authenticator:custom",
  // Error message from:
  // https://github.com/simplabs/ember-simple-auth/blob/master/examples/2-errors.html#L141
  actions: {
    // display an error when authentication fails
    authenticate: function() {
      var _this = this;
      this._super().then(null, function(error) {
        var message = error;
        _this.set('errorMessage', message);
      });
    }
  }
});