import React from "react";
import Modal from "react-modal";

const PopupModal = ({ isOpen, closeModal, content }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Popup Modal"
    >
      <div>
        <h2>Popup Modal</h2>
        <p>{content}</p>
        <button onClick={closeModal}>Close Modal</button>
      </div>
    </Modal>
  );
};

export default PopupModal;
