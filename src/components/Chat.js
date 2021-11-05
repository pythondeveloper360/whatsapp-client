
const Chat = ({ chat ,select,selected}) => {
  return (
    <>
      <li className = {`list-group-item ${selected? "active":''}`} onClick = {()=>select(chat.id)}>{chat.name}{chat.unReadMessages?<span className="badge bg-secondary">{chat.unReadMessages}</span>:null}</li>
    </>
  );
};

export default Chat;
