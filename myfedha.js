App = {}
App.Transactions = new Mongo.Collection("transactions");
App.Accounts = new Mongo.Collection("accounts");
App.refreshCurrentDateTime = function(){
  Session.set('currentDateTime', moment().format('YYYY-MM-DD HH:mm:ss'));
};
App.getCurrentDateTime = function(){
  App.refreshCurrentDateTime();
  return Session.get('currentDateTime');
};

Accounts.config({
  forbidClientAccountCreation: true
});

if (Meteor.isClient) {

  App.refreshCurrentDateTime();

  if (! Session.get('startDateTime')) {
    Session.set('startDateTime', moment().format());
  }

  if (! Session.get('endDateTime')) {
    Session.set('endDateTime', moment().add(2, 'weeks').format());
  }

  Template.body.events({
    "submit .new-transaction": function (event) {
      // This function is called when the new task form is submitted

      var amount = event.target.amount.value;
      var type = event.target.type.value;
      var description = event.target.description.value;
      var date = moment(event.target.date.value).toISOString();
      var accountId = event.target.accountId.value;
      var accountMongoId = new Mongo.ObjectID(accountId);

      var account = App.Accounts.findOne(accountMongoId);
      if (!account) {
        alert('Could not find account.');
        return false;
      }

      App.Transactions.insert({
        amount: amount,
        type: type,
        description: description,
        date: date,
        createdAt: new Date(),
        accountId: accountMongoId,
        userId: Meteor.userId()
      });

      var multiplier = (type == 'expense') ? -1 : 1;
      App.Accounts.update(accountMongoId, {
        $inc: {
          amount: amount * multiplier
        }
      });

      // Clear form
      event.target.amount.value = '';
      event.target.description.value = '';
      event.target.date.value = App.getCurrentDateTime();

      // Prevent default form submit
      return false;
    },
    "click .delete": function () {
      var amount = parseInt(this.amount);
      var accountMongoId = new Mongo.ObjectID(this.accountId.toHexString());

      var account = App.Accounts.findOne(accountMongoId);
      if (!account) {
        alert('Could not find account.');
        return false;
      }

      var multiplier = (this.type == 'expense') ? 1 : -1;
      App.Accounts.update(accountMongoId, {
        $inc: {
          amount: amount * multiplier
        }
      });

      App.Transactions.remove(this._id);
    },
    "click .prev": function (event) {
      event.preventDefault();
      var start = Session.get('startDateTime');
      var end = Session.get('endDateTime');
      Session.set('startDateTime', moment(start).subtract(2, 'weeks').format());
      Session.set('endDateTime', moment(end).subtract(2, 'weeks').format());
      return false;
    },
    "click .next": function (event) {
      event.preventDefault();
      var start = Session.get('startDateTime');
      var end = Session.get('endDateTime');
      Session.set('startDateTime', moment(start).add(2, 'weeks').format());
      Session.set('endDateTime', moment(end).add(2, 'weeks').format());
      return false;
    },
    "change .start-date input": function (event) {
      Session.set("startDateTime", event.target.start);
    },
    "change .end-date input": function (event) {
      Session.set("endDateTime", event.target.end);
    },
    "click .form-refresh-date": function (event) {
      App.refreshCurrentDateTime();
    }
  });

  Template.body.helpers({
    date: function(){
      return Session.get('currentDateTime');
    },
    startDateTime: function(){
      return Session.get('startDateTime');
    },
    endDateTime: function(){
      return Session.get('endDateTime');
    },
    dateRange: function(){
      var start = moment(Session.get('startDateTime'));
      var end = moment(Session.get('endDateTime'));
      var dateRange = start.format('MMM D, YYYY') + ' to ' + end.format('MMM D, YYYY');
      return dateRange;
    },
    transactions: function() {
      var start = Session.get('startDateTime');
      var end = Session.get('endDateTime');
      //return App.Transactions.find({date: {"$gt":start, "$lt":end}}, {sort: {date: 1}});
      return App.Transactions.find({}, {sort: {date: 1}});
    },
    accounts: function() {
      return App.Accounts.find({userId:Meteor.userId()}, {sort: {name: 1}});
    }
  });

  Template.accountSelect.helpers({
    toHexString: function(id) {
      return id.toHexString();
    }
  });

  Template.transaction.helpers({
    getUsername: function(userId) {
      var user = Meteor.users.findOne({_id: userId});
      if (user) {
        if (user.username) {
          return user.username;
        } else {
          var emails = user.emails;
          var email = '';
          for (var i in emails) {
            email = emails[i].address;
            break;
          }
          return email;
        }
      } else {
        return '';
      }
    },
    dateFormat: function(date) {
      return moment(date).format('MMM D, YYYY');
    }
  });

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
