const Msg = ({msg,user}) => {
  return (
    <>
    <div className = {msg.sender_id === user?'mymsg' : 'msg' } id = {msg.id}>
        <p className = 'time'><strong>Time: </strong>{msg.time}</p>
        <p className = 'date'><strong>Date: </strong>{msg.date}</p>

        <p className = 'content'>{msg.msg}</p>
    </div>
    </>
  );
};

export default Msg;
