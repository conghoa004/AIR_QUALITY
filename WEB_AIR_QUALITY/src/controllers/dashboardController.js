// Lấy model cần đính kèm nếu có
export default (req, res) =>{
    res.render('admin/dashboard', { title: 'Dashboard', layout: 'layouts/admin' });
}