Transactions = new Mongo.Collection("transactions");

if (Meteor.isClient) {

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
      var description = event.target.description.value;
      var date = event.target.date.value;

      Transactions.insert({
        amount: amount,
        description: description,
        date: date,
        createdAt: new Date()
      });

      // Clear form
      event.target.amount.value = "";
      event.target.description.value = "";
      event.target.date.value = "";

      // Prevent default form submit
      return false;
    },
    "click .delete": function () {
      Transactions.remove(this._id);
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
    }
  });

  Template.body.helpers({
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
      return Transactions.find({date: {"$gt":start, "$lt":end}}, {sort: {createdAt: -1}});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
