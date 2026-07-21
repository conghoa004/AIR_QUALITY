function showToast(title, text, icon = 'success') {
    Swal.fire({
        title, text, icon,
        timer: 3000, showConfirmButton: false, toast: true, position: 'top-end',
        showClass: { popup: 'animate__animated animate__slideInRight animate__faster' },
        hideClass: { popup: 'animate__animated animate__slideOutRight animate__faster' }
    });
}