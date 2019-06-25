
const {createEnterRequest, createResponse} = require('../protocol');

describe('props', () => {

  it('userId should be unique', async () => {
    User.config.restore();

    const user1 = new User('http://localhost');
    const user2 = new User('http://localhost');
    const user3 = new User('http://localhost');

    assert.notEqual(user1.id, user2.id);
    assert.notEqual(user1.id, user3.id);
    assert.notEqual(user2.id, user3.id);
  });

  it('sessionId should be unique', async () => {
    nock('http://localhost')
      .post('/', createEnterRequest())
      .reply(200, createResponse())
      .post('/', createEnterRequest({session: {session_id: 'session-2'}}))
      .reply(200, createResponse());

    const user = new User('http://localhost');
    await user.enter();
    const sessionId = user.sessionId;
    await user.enter();

    assert.notEqual(user.sessionId, sessionId);
  });

  it('should use userId from extraProps if defined as object', async () => {
    const user = new User('http://localhost', {session: {user_id: 'foo'}});
    assert.equal(user.id, 'foo');
  });

  it('should update userId from extraProps after first request if defined as function', async () => {
    nock('http://localhost')
      .post('/', createEnterRequest({session: {user_id: 'foo'}}))
      .reply(200, createResponse());

    const user = new User('http://localhost', body => body.session.user_id = 'foo');
    await user.enter();
    assert.equal(user.id, 'foo');
  });
});
