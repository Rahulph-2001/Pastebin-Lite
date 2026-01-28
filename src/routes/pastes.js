import {prisma} from '../app.js'
import { now } from '../utils/time.js'


export function pasteRoutes(app){
    app.post("/api/pastes", async (req,res)=> {
        try {

            const {content,ttl_seconds, max_views} = req.body;

            if(!content || typeof content !== 'string' || content.trim() === ""){
                return res.status(400).json({error: 'content is required and must be a non-empty string'})
            }

            if(ttl_seconds !== undefined){
                if(!Number.isInteger(ttl_seconds) || ttl_seconds < 1){
                    return res.status(400).json({error: 'ttl_seconds must be an integer >= 1'})
                }
            }

            if(max_views !== undefined) {
                if(!Number.isInteger(max_views) || max_views <1){
                    return res.status(400).json({error: 'max_views must be a integer >= 1'})
                }
            }

            let expiresAt = null
            if(ttl_seconds){
                expiresAt = new Date(Date.now() + ttl_seconds * 1000)
            }

            const paste = await prisma.paste.create({
                data: {
                    content,
                    expiresAt,
                    maxViews: max_views || null
                }
            })
             const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
             const url = `${baseUrl}/p/${paste.id}`;
             res.status(201).json({id: paste.id,url})

        } catch (error) {
            console.error('Error creating paste:', error);
            res.status(500).json({error: "Internal server error"})
        }
    });


    app.get("/api/pastes/:id",async (req,res) => {
        try {

            const {id} = req.params;
            const currentTime = now(req);

            const paste = await prisma.paste.findUnique({where: {id}})

            if(!paste){
                return res.status(404).json({error: 'Paste not found'})
            }

            if(paste.expiresAt && currentTime >= paste.expiresAt){
                return res.status(404).json({error: "Paste has expired"})
            }

            if(paste.maxViews !== null && paste.viewCount >= paste.maxViews){
                return res.status(404).json({error:"Paste view limit exceeded"})
            }

            const updatedPaste = await prisma.paste.update({
                where: {id},
                data: {viewCount: {increment: 1}},
            });

            let remaining_views = null;
            if(updatedPaste.maxViews !== null){
                remaining_views = updatedPaste.maxViews - updatedPaste.viewCount;
            }

            res.json({
                content: updatedPaste.content,
                remaining_views,
                expires_at : updatedPaste.expiresAt ? updatedPaste.expiresAt.toISOString(): null,

            })
            
        } catch (error) {
            console.error("Error fetching paste:",error);
            res.status(500).json({error: 'Internal server error'})
        }
    })
}